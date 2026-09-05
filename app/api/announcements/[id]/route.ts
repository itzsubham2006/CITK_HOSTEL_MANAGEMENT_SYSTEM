import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const announcementId = parseInt(id, 10)

    if (isNaN(announcementId)) {
      return NextResponse.json({ error: 'Invalid announcement ID' }, { status: 400 })
    }

    // Verify requesting user is admin/warden
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'warden')) {
      return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
    }

    const supabaseAdmin = createAdminClient()

    // Fetch announcement title before deletion to clean up legacy notification messages
    const { data: announcement } = await supabaseAdmin
      .from('announcements')
      .select('title')
      .eq('id', announcementId)
      .maybeSingle()

    // Delete announcement (triggers Postgres CASCADE)
    const { error: deleteError } = await supabaseAdmin
      .from('announcements')
      .delete()
      .eq('id', announcementId)

    if (deleteError) {
      throw deleteError
    }

    // Explicitly clean up any matching notifications using service role
    await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('announcement_id', announcementId)

    if (announcement?.title) {
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('link', '/announcements')
        .ilike('message', `%${announcement.title}%`)
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Delete announcement API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    )
  }
}
