import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Please log in to share hostel memories.' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('image') as File | null
    const caption = (formData.get('caption') as string) || ''

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Please select an image file.' }, { status: 400 })
    }

    // Enforce 10MB maximum file size
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image size must be less than 10MB.' }, { status: 400 })
    }

    // Validate mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file format. Please upload a JPEG, PNG, WEBP, or GIF image.' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createAdminClient()

    // 1. Auto-check & auto-create the 'diary-images' bucket if it does not already exist
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some((b) => b.name === 'diary-images')

    if (!bucketExists) {
      const { error: createBucketError } = await supabaseAdmin.storage.createBucket('diary-images', {
        public: true,
        fileSizeLimit: 10485760,
        allowedMimeTypes: validTypes,
      })
      if (createBucketError) {
        console.warn('Bucket creation warning (may already exist):', createBucketError.message)
      }
    }

    // 2. Upload image using service role client to bypass client-side RLS blocking
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('diary-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // 3. Retrieve public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('diary-images')
      .getPublicUrl(filePath)

    const publicUrl = publicUrlData.publicUrl

    // 4. Insert row into hostel_diaries
    const { data: newDiary, error: insertError } = await supabaseAdmin
      .from('hostel_diaries')
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        caption: caption.trim() || 'Hostel Memory',
      })
      .select('*, profiles(username, hostel)')
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { error: `Database save failed: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      diary: newDiary,
    })
  } catch (err: unknown) {
    console.error('Unexpected diary upload error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred during upload.' },
      { status: 500 }
    )
  }
}
