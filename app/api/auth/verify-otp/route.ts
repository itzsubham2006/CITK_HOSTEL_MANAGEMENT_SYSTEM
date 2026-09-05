import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HostelName, UserRole } from '@/types/database.types'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, otp, password, name, hostel, roomNo } = body

    if (!email || !otp || !password || !name) {
      return NextResponse.json(
        { error: 'All fields (Name, Email, Password, and OTP) are required.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanOtp = otp.trim()
    const supabaseAdmin = createAdminClient()

    // 1. Verify OTP in otp_verifications table
    const { data: otpRecords, error: fetchOtpError } = await supabaseAdmin
      .from('otp_verifications')
      .select('*')
      .eq('email', cleanEmail)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchOtpError || !otpRecords || otpRecords.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code. Please request a new code.' },
        { status: 400 }
      )
    }

    const activeOtp = otpRecords[0]

    // Check if code matches
    if (activeOtp.otp_code !== cleanOtp) {
      return NextResponse.json(
        { error: 'Incorrect verification code. Please check and try again.' },
        { status: 400 }
      )
    }

    // Check expiration (10 minutes)
    if (new Date(activeOtp.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'This verification code has expired. Please click "Resend code".' },
        { status: 400 }
      )
    }

    // 2. Mark OTP as verified
    await supabaseAdmin
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', activeOtp.id)

    // 3. Determine role based on allowlists and domain restriction
    let assignedRole: UserRole = 'student'

    const { data: adminRecord } = await supabaseAdmin
      .from('admin_emails')
      .select('email')
      .eq('email', cleanEmail)
      .maybeSingle()

    const { data: wardenRecord } = await supabaseAdmin
      .from('warden_emails')
      .select('email')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (adminRecord) {
      assignedRole = 'admin'
    } else if (wardenRecord) {
      assignedRole = 'warden'
    } else if (cleanEmail.endsWith('@cit.ac.in')) {
      assignedRole = 'student'
    } else {
      return NextResponse.json(
        {
          error:
            'Only @cit.ac.in email addresses can sign up as students. Contact an admin if you should have admin/warden access.',
        },
        { status: 400 }
      )
    }

    // 4. Create Supabase Auth User with pre-confirmed email status
    const isNoneHostel = !hostel || hostel === 'None'
    const parsedHostel: HostelName | null = isNoneHostel ? null : (hostel as HostelName)
    const parsedRoom = roomNo?.trim() || 'None'

    let finalUserId: string | null = null

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        username: name,
        hostel: parsedHostel,
        room_no: parsedRoom,
        role: assignedRole,
      },
    })

    if (authError) {
      const isAlreadyRegistered =
        authError.code === 'email_exists' ||
        authError.message?.toLowerCase().includes('already registered') ||
        authError.message?.toLowerCase().includes('already exists')

      if (isAlreadyRegistered) {
        // User record already exists in auth.users (e.g. from previous failed attempt),
        // but user has now verified ownership via 6-digit OTP. Recover by updating password and metadata.
        const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 1000,
        })

        if (listError) {
          console.error('Error listing auth users during recovery:', listError)
          return NextResponse.json(
            { error: `Account setup failed: ${listError.message}` },
            { status: 500 }
          )
        }

        const existingUser = usersList?.users?.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        )

        if (existingUser) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            {
              password: password,
              email_confirm: true,
              user_metadata: {
                username: name,
                hostel: parsedHostel,
                room_no: parsedRoom,
                role: assignedRole,
              },
            }
          )

          if (updateError) {
            console.error('Error updating existing auth user:', updateError)
            return NextResponse.json(
              { error: `Account setup failed: ${updateError.message}` },
              { status: 500 }
            )
          }

          finalUserId = existingUser.id
        } else {
          return NextResponse.json(
            { error: 'An account with this email is already registered. Please log in.' },
            { status: 400 }
          )
        }
      } else {
        console.error('Error creating Supabase auth user:', authError)
        return NextResponse.json(
          { error: `Account creation failed: ${authError.message}` },
          { status: 500 }
        )
      }
    } else if (authUser?.user) {
      finalUserId = authUser.user.id
    }

    // 5. Ensure profile is upserted with assigned role
    if (finalUserId) {
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: finalUserId,
        username: name,
        email: cleanEmail,
        hostel: parsedHostel,
        room_no: parsedRoom,
        role: assignedRole,
      })

      if (profileError) {
        console.error('Error upserting profile:', profileError)
      }
    }

    // 6. Return role and dashboard redirect path
    let redirectTo = '/student/dashboard'
    if (assignedRole === 'admin') {
      redirectTo = '/admin/dashboard'
    } else if (assignedRole === 'warden') {
      redirectTo = '/warden/dashboard'
    }

    return NextResponse.json({
      success: true,
      role: assignedRole,
      redirectTo,
      message: 'Account verified and created successfully!',
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while verifying the code.' },
      { status: 500 }
    )
  }
}
