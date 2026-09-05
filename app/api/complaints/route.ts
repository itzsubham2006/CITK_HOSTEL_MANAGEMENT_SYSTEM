import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ComplaintCategory, HostelName } from '@/types/database.types'

export const dynamic = 'force-dynamic'

const VALID_HOSTELS: HostelName[] = ['SNM', 'SJ', 'JD', 'BJ', 'Bakhungri', 'Gambari']
const VALID_CATEGORIES: ComplaintCategory[] = [
  'Electricity',
  'Water',
  'Cleanliness',
  'Food',
  'Furniture',
  'Internet',
  'Security',
  'Bathroom',
  'Other',
]

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to report a hostel issue.' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const category = formData.get('category') as ComplaintCategory
    const description = (formData.get('description') as string) || ''
    const rawHostel = formData.get('hostel') as string
    const image = formData.get('image') as File | null

    // 1. Validation
    if (!description.trim()) {
      return NextResponse.json({ error: 'Issue description is required.' }, { status: 400 })
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Please select a valid issue category.' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // 2. Fetch or auto-heal profile in public.profiles
    let userHostel: HostelName = 'SJ'
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profile) {
      userHostel = profile.hostel || 'SJ'
    } else {
      // Auto-heal missing profile row
      const defaultHostel = (user.user_metadata?.hostel as HostelName) || 'SJ'
      userHostel = VALID_HOSTELS.includes(defaultHostel) ? defaultHostel : 'SJ'
      await supabaseAdmin.from('profiles').insert({
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Student',
        email: user.email || '',
        hostel: userHostel,
        room_no: user.user_metadata?.room_no || 'N/A',
        role: (user.user_metadata?.role as any) || 'student',
      })
    }

    const targetHostel: HostelName = VALID_HOSTELS.includes(rawHostel as HostelName)
      ? (rawHostel as HostelName)
      : userHostel

    // 3. Handle image upload via Admin Client if provided
    let imageUrl: string | null = null

    if (image && image instanceof File && image.size > 0) {
      if (image.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image size must be less than 10MB.' }, { status: 400 })
      }

      const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
      if (!validMimeTypes.includes(image.type)) {
        return NextResponse.json(
          { error: 'Invalid image format. Supported formats: JPEG, PNG, WEBP, GIF.' },
          { status: 400 }
        )
      }

      // Ensure bucket exists
      const bucketName = 'complaint-images'
      const { data: buckets } = await supabaseAdmin.storage.listBuckets()
      if (!buckets?.some((b) => b.name === bucketName)) {
        await supabaseAdmin.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760,
          allowedMimeTypes: validMimeTypes,
        })
      }

      const fileExt = image.name.split('.').pop() || 'jpg'
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const arrayBuffer = await image.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { error: uploadError } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: image.type,
          upsert: true,
        })

      if (uploadError) {
        console.error('Storage upload error for complaint:', uploadError)
        // Non-fatal: still allow complaint submission even if image fails
      } else {
        const { data: publicUrlData } = supabaseAdmin.storage
          .from(bucketName)
          .getPublicUrl(filePath)
        imageUrl = publicUrlData.publicUrl
      }
    }

    // 4. Insert into public.complaints
    const { data: complaint, error: insertError } = await supabaseAdmin
      .from('complaints')
      .insert({
        user_id: user.id,
        hostel: targetHostel,
        category,
        description: description.trim(),
        image_url: imageUrl,
        status: 'Pending',
        upvotes: 1,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Complaint insert error:', insertError)
      return NextResponse.json(
        {
          error:
            insertError.message.includes('record "new" has no field "title"')
              ? 'Database trigger error: Please run the latest SQL migration in Supabase SQL editor to fix the trigger.'
              : insertError.message || 'Failed to submit complaint.',
        },
        { status: 500 }
      )
    }

    // 5. Insert initial upvote
    try {
      await supabaseAdmin.from('complaint_upvotes').insert({
        user_id: user.id,
        complaint_id: complaint.id,
      })
    } catch {
      // Non-fatal
    }

    // 6. Notify Wardens & Admins
    try {
      const { data: staffProfiles } = await supabaseAdmin
        .from('profiles')
        .select('id, role, hostel')

      if (staffProfiles && staffProfiles.length > 0) {
        const recipients = staffProfiles.filter(
          (s) => s.role === 'admin' || (s.role === 'warden' && (!s.hostel || s.hostel === targetHostel))
        )

        if (recipients.length > 0) {
          const shortDesc = description.trim().slice(0, 50)
          const notifs = recipients.map((r) => ({
            user_id: r.id,
            message: `🚨 New Issue in ${targetHostel} (${category}): ${shortDesc}`,
            link: '/issues',
            is_read: false,
          }))

          await supabaseAdmin.from('notifications').insert(notifs)
        }
      }
    } catch (notifErr) {
      console.error('Failed to dispatch staff notifications:', notifErr)
    }

    return NextResponse.json({ success: true, complaint })
  } catch (err: unknown) {
    console.error('API /api/complaints error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
