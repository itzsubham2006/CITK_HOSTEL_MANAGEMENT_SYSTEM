import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { HostelName } from '@/types/database.types'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'warden')) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins and wardens can publish announcements' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { title, message, hostel, is_pinned } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Announcement title is required' }, { status: 400 })
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Announcement message is required' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // 1. Insert announcement
    const parsedHostel = hostel && hostel !== 'None' && hostel !== '' ? (hostel as HostelName) : null
    const { data: newAnnouncement, error: insertError } = await supabaseAdmin
      .from('announcements')
      .insert({
        title: title.trim(),
        message: message.trim(),
        hostel: parsedHostel,
        is_pinned: Boolean(is_pinned),
        author_id: user.id,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Insert announcement error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 2. Guaranteed Notification Dispatch:
    // Global announcements -> Notify ALL profiles (students, admins, wardens)
    // Hostel announcements -> Notify students of that hostel AND all admins & wardens
    const { data: allProfiles, error: profilesErr } = await supabaseAdmin
      .from('profiles')
      .select('id, hostel, role')

    if (!profilesErr && allProfiles && allProfiles.length > 0) {
      const recipients = allProfiles.filter((p) => {
        if (!parsedHostel) return true // global: everyone gets notified
        return p.hostel === parsedHostel || p.role === 'admin' || p.role === 'warden'
      })

      if (recipients.length > 0) {
        const prefix = parsedHostel ? `📢 ${parsedHostel} Announcement:` : '📢 Global Announcement:'
        const notificationsToInsert = recipients.map((r) => ({
          user_id: r.id,
          message: `${prefix} ${title.trim()}`,
          link: '/announcements',
          announcement_id: newAnnouncement.id,
          is_read: false,
        }))

        // Batch insert notifications with fallback if announcement_id column doesn't exist yet on remote table
        for (let i = 0; i < notificationsToInsert.length; i += 100) {
          const chunk = notificationsToInsert.slice(i, i + 100)
          const { error: notifErr } = await supabaseAdmin.from('notifications').insert(chunk)
          if (notifErr) {
            console.warn('Direct notification insert failed, trying fallback without announcement_id:', notifErr.message)
            const fallbackChunk = chunk.map(({ announcement_id, ...rest }) => rest)
            await supabaseAdmin.from('notifications').insert(fallbackChunk)
          }
        }
      }
    }

    return NextResponse.json({ success: true, announcement: newAnnouncement })
  } catch (err: unknown) {
    console.error('Create announcement error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
