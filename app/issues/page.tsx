'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ComplaintStatus, HostelName } from '@/types/database.types'

export default function AllIssuesPage() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userUpvotedSet, setUserUpvotedSet] = useState<Set<number>>(new Set())
  const supabase = createClient()

  const loadData = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let currentProfile = null
      if (user) {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        currentProfile = prof
        setUserProfile(prof)

        const { data: upvotes } = await supabase.from('complaint_upvotes').select('complaint_id').eq('user_id', user.id)
        setUserUpvotedSet(new Set(upvotes?.map((u) => u.complaint_id) || []))
      }

      let query = supabase.from('complaints').select('*').order('upvotes', { ascending: false }).order('created_at', { ascending: false })

      if (currentProfile && currentProfile.role === 'student' && currentProfile.hostel) {
        query = query.eq('hostel', currentProfile.hostel)
      }

      const { data, error } = await query
      if (error) throw error
      setComplaints(data || [])
    } catch (err) {
      console.error('Failed to load issues:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpvote = async (complaintId: number, currentUpvotes: number) => {
    if (!userProfile) return
    if (userUpvotedSet.has(complaintId)) {
      alert('You already upvoted this issue.')
      return
    }

    try {
      // Optimistic update
      setUserUpvotedSet((prev) => new Set(prev).add(complaintId))
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaintId ? { ...c, upvotes: currentUpvotes + 1 } : c))
      )

      await supabase.from('complaint_upvotes').insert({
        user_id: userProfile.id,
        complaint_id: complaintId,
      })
    } catch (err) {
      console.error('Failed to upvote:', err)
    }
  }

  const handleAdminStatusUpdate = async (complaintId: number, newStatus: ComplaintStatus) => {
    try {
      await supabase.from('complaints').update({ status: newStatus }).eq('id', complaintId)
      setComplaints((prev) =>
        prev.map((c) => (c.id === complaintId ? { ...c, status: newStatus } : c))
      )
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const hostelLabel = userProfile?.role === 'admin' ? 'All Hostels' : userProfile?.hostel || 'Hostel'

  return (
    <div className="issues-page-wrapper" style={{ marginBottom: '50px' }}>
      <h2 className="issues-page-title">
        All Issues – {hostelLabel}
      </h2>

      {loading ? (
        <p style={{ textAlign: 'center', marginTop: '30px', color: '#666' }}>Loading issues...</p>
      ) : complaints.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '30px', color: '#666' }}>No issues reported in {hostelLabel}.</p>
      ) : (
        <div className="issues-vertical-list">
          {complaints.map((c, index) => {
            const hasVoted = userUpvotedSet.has(c.id)
            const dateStr = new Date(c.created_at).toLocaleString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })

            return (
              <div className={`issue-row-card ${index < 3 ? 'top-issue' : ''}`} key={c.id}>
                <div className="issue-row-content">
                  {/* HEADER */}
                  <div className="issue-row-header">
                    <div className="issue-row-index">{index + 1}</div>
                    <span className="issue-row-category">{c.category}</span>

                    {userProfile?.role === 'admin' || userProfile?.role === 'warden' ? (
                      <select
                        value={c.status}
                        onChange={(e) => handleAdminStatusUpdate(c.id, e.target.value as ComplaintStatus)}
                        className="status-select"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    ) : (
                      <span
                        className={`issue-row-status ${
                          c.status === 'Pending'
                            ? 'status-pending'
                            : c.status === 'In Progress'
                            ? 'status-progress'
                            : 'status-resolved'
                        }`}
                      >
                        {c.status}
                      </span>
                    )}
                  </div>

                  <p className="issue-row-desc">{c.description}</p>

                  {c.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image_url} alt="Issue evidence" className="issue-row-image" />
                  )}

                  <div className="issue-row-time">
                    {dateStr}
                  </div>
                </div>

                <div className="issue-row-actions">
                  <button
                    type="button"
                    className={`issue-upvote-btn ${hasVoted ? 'voted' : ''}`}
                    disabled={hasVoted}
                    onClick={() => handleUpvote(c.id, c.upvotes)}
                  >
                    {hasVoted ? '✔' : '+'}
                  </button>

                  <span className="issue-upvote-count" id={`vote-count-${c.id}`}>
                    {c.upvotes}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
