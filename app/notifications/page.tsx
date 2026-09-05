'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type NotificationCategory = 'all' | 'unread' | 'announcements' | 'issues'

export default function NotificationPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all')
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

      // Fetch user profile to identify role and hostel
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      // Fetch user notifications and active announcements concurrently
      const [notifsRes, announcementsRes] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('announcements')
          .select('id, title, message, hostel, created_at')
          .order('created_at', { ascending: false }),
      ])

      const notifs = notifsRes.data || []
      const activeAnnouncements = announcementsRes.data || []
      const activeAnnouncementIds = new Set(activeAnnouncements.map((a) => a.id))

      // 1. Dynamic filtering: Exclude notifications linked to announcements that have been deleted
      const validNotifications = notifs.filter((n) => {
        if (n.announcement_id) {
          return activeAnnouncementIds.has(n.announcement_id)
        }
        // For legacy notifications without announcement_id:
        if (n.link === '/announcements' || (n.message && n.message.includes('📢'))) {
          const matchesAnyActive = activeAnnouncements.some((a) => n.message.includes(a.title))
          if (activeAnnouncements.length === 0 || !matchesAnyActive) {
            return false
          }
        }
        return true
      })

      // 2. Dynamic announcement coverage: Ensure Admins, Wardens, and Students see all active announcements
      const userRole = profile?.role || 'student'
      const userHostel = profile?.hostel

      const existingAnnouncementIds = new Set(
        validNotifications.filter((n) => n.announcement_id).map((n) => n.announcement_id)
      )

      const missingAnnouncements = activeAnnouncements.filter((a) => {
        if (existingAnnouncementIds.has(a.id)) return false
        if (userRole === 'admin' || userRole === 'warden') return true
        return !a.hostel || a.hostel === userHostel
      })

      // Synthesize missing notifications for instantaneous dynamic display
      const synthesizedNotifications = missingAnnouncements.map((a) => ({
        id: -a.id, // negative ID to distinguish synthetic notifications
        user_id: user.id,
        message: a.hostel ? `📢 ${a.hostel} Announcement: ${a.title}` : `📢 Global Announcement: ${a.title}`,
        link: '/announcements',
        announcement_id: a.id,
        is_read: false,
        created_at: a.created_at,
      }))

      const combined = [...synthesizedNotifications, ...validNotifications].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setNotifications(combined)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isCancelled = false
    let channel: ReturnType<typeof supabase.channel> | null = null

    loadNotifications()

    const setupListener = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user || isCancelled) return

        // Unique channel name avoids duplicate subscription errors during fast re-renders
        const channelName = `notifs_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              if (!isCancelled) {
                loadNotifications()
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'announcements',
            },
            () => {
              if (!isCancelled) {
                loadNotifications()
              }
            }
          )
          .subscribe()
      } catch (err) {
        console.error('Realtime setup error:', err)
      }
    }

    setupListener()

    return () => {
      isCancelled = true
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const handleMarkAsRead = async (id: number) => {
    try {
      if (id > 0) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id)
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch (err) {
      console.error('Mark read error:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch (err) {
      console.error('Mark all read error:', err)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      if (id > 0) {
        await supabase.from('notifications').delete().eq('id', id)
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.error('Delete notification error:', err)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all your notifications?')) return
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

  // Determine category for styling & filtering
  const getCategory = (n: any): 'announcement' | 'issue' | 'general' => {
    if (n.announcement_id || n.link === '/announcements' || n.message.includes('📢')) {
      return 'announcement'
    }
    if (n.link?.startsWith('/issues') || n.message.includes('🚨') || n.message.toLowerCase().includes('issue')) {
      return 'issue'
    }
    return 'general'
  }

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  )

  const announcementCount = useMemo(
    () => notifications.filter((n) => getCategory(n) === 'announcement').length,
    [notifications]
  )

  const issueCount = useMemo(
    () => notifications.filter((n) => getCategory(n) === 'issue').length,
    [notifications]
  )

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') return notifications.filter((n) => !n.is_read)
    if (activeTab === 'announcements')
      return notifications.filter((n) => getCategory(n) === 'announcement')
    if (activeTab === 'issues')
      return notifications.filter((n) => getCategory(n) === 'issue')
    return notifications
  }, [notifications, activeTab])

  return (
    <div className="notification-section">
      {/* Header Row */}
      <div className="notification-header-row">
        <div className="notification-title-group">
          <h3>
            <span>🔔</span> Notifications
            {unreadCount > 0 && (
              <span
                style={{
                  fontSize: '13px',
                  background: '#16a34a',
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600,
                }}
              >
                {unreadCount} new
              </span>
            )}
          </h3>
          <p>Stay informed about campus announcements, issue updates, and hostel notices.</p>
        </div>

        {notifications.length > 0 && (
          <div className="notification-action-buttons">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  color: '#15803d',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                ✓ Mark all as read
              </button>
            )}

            <button
              type="button"
              onClick={handleClearAll}
              style={{
                background: '#fff',
                border: '1px solid #cbd5e1',
                color: '#64748b',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🗑 Clear All
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="notification-filter-tabs">
        <button
          type="button"
          className={`notification-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({notifications.length})
        </button>

        <button
          type="button"
          className={`notification-tab-btn ${activeTab === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveTab('unread')}
        >
          Unread ({unreadCount})
        </button>

        <button
          type="button"
          className={`notification-tab-btn ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          📢 Announcements ({announcementCount})
        </button>

        <button
          type="button"
          className={`notification-tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
          onClick={() => setActiveTab('issues')}
        >
          🚨 Issues ({issueCount})
        </button>
      </div>

      {/* Notification List */}
      <div className="notification-list">
        {loading ? (
          <div className="notification-empty-state">
            <p>Loading your notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notification-empty-state">
            <div className="notification-empty-icon">🔔</div>
            <h4>All caught up!</h4>
            <p>
              {activeTab === 'unread'
                ? 'You have read all your notifications.'
                : activeTab === 'announcements'
                ? 'No announcement notifications at this time.'
                : activeTab === 'issues'
                ? 'No issue status notifications found.'
                : 'No notifications available right now.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const category = getCategory(n)
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
              >
                {/* Category Icon Box */}
                <div className={`notification-icon-box ${category}`} aria-hidden="true">
                  {category === 'announcement' ? '📢' : category === 'issue' ? '🚨' : '🔔'}
                </div>

                {/* Content Area */}
                <div className="notification-content">
                  <div className="notification-content-header">
                    <span className={`notification-category-tag ${category}`}>
                      {category === 'announcement'
                        ? 'Announcement'
                        : category === 'issue'
                        ? 'Hostel Issue'
                        : 'Notice'}
                    </span>
                    <span className="notification-date">{dateStr}</span>
                  </div>

                  <p className="notification-text">{n.message}</p>

                  <div className="notification-actions-row">
                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={() => {
                          if (!n.is_read) handleMarkAsRead(n.id)
                        }}
                        className="notification-link-btn"
                      >
                        {category === 'announcement'
                          ? 'View Announcement →'
                          : category === 'issue'
                          ? 'View Issue Details →'
                          : 'View →'}
                      </Link>
                    )}

                    {!n.is_read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(n.id)}
                        className="notification-mark-read-btn"
                      >
                        ✓ Mark read
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  className="notification-delete-btn"
                  title="Remove notification"
                  aria-label="Remove notification"
                >
                  ✕
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
