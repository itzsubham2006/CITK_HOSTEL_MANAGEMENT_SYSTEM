'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NotificationPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login?redirect=/notifications')
        return
      }

      // Fetch active announcements to verify announcement notifications are valid
      const { data: activeAnnouncements } = await supabase
        .from('announcements')
        .select('id, title')

      const activeAnnounceIds = new Set((activeAnnouncements || []).map((a) => a.id))
      const activeAnnounceTitles = (activeAnnouncements || []).map((a) => a.title.toLowerCase())

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const validNotifications: any[] = []
      const orphanedIdsToDelete: number[] = []

      for (const n of data || []) {
        if (n.link === '/announcements') {
          // If linked to an announcement, check if the announcement still exists
          if (n.announcement_id && !activeAnnounceIds.has(n.announcement_id)) {
            orphanedIdsToDelete.push(n.id)
            continue
          }
          // Legacy check if announcement_id wasn't saved yet
          if (!n.announcement_id) {
            const matchesActive = activeAnnounceTitles.some((t) =>
              n.message.toLowerCase().includes(t)
            )
            if (!matchesActive) {
              orphanedIdsToDelete.push(n.id)
              continue
            }
          }
        }
        validNotifications.push(n)
      }

      setNotifications(validNotifications)

      // Clean up orphaned notifications from database asynchronously
      if (orphanedIdsToDelete.length > 0) {
        Promise.resolve(
          supabase.from('notifications').delete().in('id', orphanedIdsToDelete)
        ).catch((err: unknown) => console.error('Cleanup orphaned error:', err))
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()

    let channel: any
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      // Subscribe to real-time notification changes for this user
      channel = supabase
        .channel(`realtime_notifications_${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadNotifications()
          }
        )
        .subscribe()
    })

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const handleDelete = async (id: number) => {
    try {
      await supabase.from('notifications').delete().eq('id', id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.error('Delete notification error:', err)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Clear all notifications?')) return
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('notifications').delete().eq('user_id', user.id)
        setNotifications([])
      }
    } catch (err) {
      console.error('Clear all error:', err)
    }
  }

  return (
    <div className="notification-section" style={{ marginBottom: '50px' }}>
      <h3>🔔 Notifications</h3>

      {notifications.length > 0 && (
        <button
          onClick={handleClearAll}
          className="btn btn-danger btn-sm mb-3"
          style={{ background: '#d32f2f', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', marginBottom: '15px' }}
        >
          🗑 Clear All Notifications
        </button>
      )}

      <div className="notification-list">
        {loading ? (
          <p className="empty-text">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="empty-text">No notifications available.</p>
        ) : (
          notifications.map((n) => {
            const dateStr = new Date(n.created_at).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })

            return (
              <div
                key={n.id}
                className={`notification-card ${!n.is_read ? 'unread' : ''}`}
                style={{ margin: '20px 10px 10px 0px' }}
              >
                <div className="notification-left">
                  <span className="dot"></span>
                </div>

                <div className="notification-content">
                  <p className="notification-text">{n.message}</p>

                  <small className="notification-date">{dateStr}</small>

                  <div style={{ marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleDelete(n.id)}
                      className="btn btn-outline-danger btn-sm"
                      style={{ background: 'transparent', color: '#d32f2f', border: '1px solid #d32f2f', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      ✖ Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
