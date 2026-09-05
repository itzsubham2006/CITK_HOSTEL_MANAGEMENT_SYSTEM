import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendOtpEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.trim().toLowerCase()
    const supabaseAdmin = createAdminClient()

    // 1. Role & Domain Verification Check (Feature 3)
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

    const isAdmin = Boolean(adminRecord)
    const isWarden = Boolean(wardenRecord)
    const isStudentDomain = cleanEmail.endsWith('@cit.ac.in')

    if (!isAdmin && !isWarden && !isStudentDomain) {
      return NextResponse.json(
        {
          error:
            'Only @cit.ac.in email addresses can sign up as students. Contact an admin if you should have admin/warden access.',
        },
        { status: 400 }
      )
    }

    // 2. Check if user already registered in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in.' },
        { status: 400 }
      )
    }

    // 3. Rate limiting: enforce 60-second cooldown between resends
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const { data: recentOtp } = await supabaseAdmin
      .from('cit_otp_requests')
      .select('id')
      .eq('email', cleanEmail)
      .gt('requested_at', oneMinuteAgo)
      .order('requested_at', { ascending: false })
      .limit(1)

    if (recentOtp && recentOtp.length > 0) {
      return NextResponse.json(
        { error: 'Please wait 60 seconds before requesting another verification code.' },
        { status: 429 }
      )
    }

    // 4. Generate 6-digit OTP and calculate 10-minute expiration
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // 5. Hash OTP and store record in cit_otp_requests table
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex')

    const { error: dbError } = await supabaseAdmin
      .from('cit_otp_requests')
      .insert({
        email: cleanEmail,
        otp_hash: otpHash,
        expires_at: expiresAt,
        attempts: 0,
        requested_at: new Date().toISOString(),
        verified_at: null,
      })

    if (dbError) {
      console.error('Error saving OTP to database:', dbError)
      return NextResponse.json(
        { error: 'Failed to generate verification code. Please try again.' },
        { status: 500 }
      )
    }

    // 6. Send OTP via Gmail SMTP
    const emailSent = await sendOtpEmail(cleanEmail, otpCode)
    if (!emailSent) {
      // In development if SMTP is not yet configured, we still allow testing by logging
      console.warn(`[DEV NOTE] OTP for ${cleanEmail} is: ${otpCode}`)
    }

    return NextResponse.json({
      success: true,
      message: 'A 6-digit verification code has been sent to your email.',
    })
  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while sending the verification code.' },
      { status: 500 }
    )
  }
}
