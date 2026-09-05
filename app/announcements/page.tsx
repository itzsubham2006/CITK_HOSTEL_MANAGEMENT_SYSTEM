'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { HostelName } from '@/types/database.types'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [hostel, setHostel] = useState<string>('')
  const [isPinned, setIsPinned] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const loadData = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setUserProfile(profile)
      }

      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (err) {
      console.error('Failed to load announcements:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    // Subscribe to real-time changes on announcements table
    const channel = supabase
      .channel('realtime_announcements_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
        },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'warden'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim() || submitting) return
    setSubmitting(true)

    try {
      const { error } = await supabase.from('announcements').insert({
        title,
        message,
        hostel: (hostel ? hostel : null) as HostelName | null,
        is_pinned: isPinned,
        author_id: userProfile?.id || null,
      })

      if (error) throw error

      setTitle('')
      setMessage('')
      setHostel('')
      setIsPinned(false)
      loadData()
    } catch (err) {
      console.error('Failed to publish announcement:', err)
      alert('Could not publish announcement.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    try {
      // Delete via API route to ensure server-side notification cascade cleanup
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        // Fallback to client-side supabase delete
        const { error } = await supabase.from('announcements').delete().eq('id', id)
        if (error) throw error
      }
      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Failed to delete announcement:', err)
      alert('Could not delete announcement.')
    }
  }

  return (
    <div className="announcement-wrapper">
      {/* Create Announcement (Admin only) */}
      {isAdmin && (
        <div className="announce-box">
          <h2>📢 Create Announcement</h2>

          <form onSubmit={handleSubmit} className="announce-form">
            <input
              type="text"
              name="title"
              placeholder="Announcement Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              name="message"
              placeholder="Write announcement message..."
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <select name="hostel" value={hostel} onChange={(e) => setHostel(e.target.value)}>
              <option value="">🌍 All Hostels</option>
              <option value="SJ">SJ Hostel</option>
              <option value="JD">JD Hostel</option>
              <option value="BJ">BJ Hostel</option>
              <option value="SNM">SNM Hostel</option>
              <option value="Gambari">Gambari Girls Hostel</option>
              <option value="Bakhungri">Bakhungri Girls Hostel</option>
            </select>

            <label className="pin-box">
              <input
                type="checkbox"
                name="pin"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              📌 Pin this announcement
            </label>

            <button type="submit" disabled={submitting}>
              {submitting ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </form>
        </div>
      )}

      {/* Previous Announcements */}
      <div className="previous-section">
        <h3>📜 Announcements</h3>

        {loading ? (
          <p className="empty-text">Loading notices...</p>
        ) : announcements.length === 0 ? (
          <p className="empty-text">No announcements yet.</p>
        ) : (
          announcements.map((a) => {
            const dateStr = new Date(a.created_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })

            return (
              <div key={a.id} className={`announce-card ${a.is_pinned ? 'pinned' : ''}`}>
                <div className="card-header">
                  <h4>
                    {a.is_pinned ? '📌 ' : ''}
                    {a.title}
                  </h4>
                  <span className="date">{dateStr}</span>
                </div>

                <p>{a.message}</p>

                {isAdmin && (
                  <div className="card-actions">
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      className="delete-btn"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
