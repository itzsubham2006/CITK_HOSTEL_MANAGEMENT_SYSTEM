'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function MyIssuesPage() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadComplaints = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setComplaints(data || [])
    } catch (err) {
      console.error('Failed to load my issues:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComplaints()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this Issue?')) return
    try {
      const { error } = await supabase.from('complaints').delete().eq('id', id)
      if (error) throw error
      setComplaints(complaints.filter((c) => c.id !== id))
    } catch (err) {
      console.error('Failed to delete complaint:', err)
      alert('Could not delete issue.')
    }
  }

  return (
    <div className="container small_container1" style={{ margin: '40px auto 100px auto', maxWidth: '1000px', padding: '0 15px' }}>
      <h2 style={{ color: '#2e7d32', borderBottom: '2px solid #2e7d32', paddingBottom: '10px' }}>
        My Reported Issues
      </h2>

      {loading ? (
        <p style={{ marginTop: '20px', color: '#666' }}>Loading your issues...</p>
      ) : complaints.length === 0 ? (
        <div style={{ marginTop: '30px', background: 'white', padding: '30px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#555', fontSize: '15px' }}>You haven&apos;t reported any issues yet.</p>
          <Link
            href="/report-issue"
            style={{
              display: 'inline-block',
              marginTop: '15px',
              background: '#2e7d32',
              color: 'white',
              padding: '8px 18px',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            Report an Issue
          </Link>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: '20px' }}>
          <table
            className="table1"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            <thead className="head">
              <tr style={{ backgroundColor: '#2e7d32', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '15px', border: '1px solid #ddd' }}>Category</th>
                <th style={{ padding: '15px', border: '1px solid #ddd' }}>Description</th>
                <th style={{ padding: '15px', border: '1px solid #ddd' }}>Status</th>
              </tr>
            </thead>

            <tbody className="tbody1">
              {complaints.map((complaint) => (
                <tr className="tr1" key={complaint.id}>
                  <td
                    className="td1"
                    data-label="Category"
                    style={{ padding: '15px', border: '1px solid #ddd', fontWeight: 'bold' }}
                  >
                    {complaint.category}
                  </td>

                  <td className="td1" data-label="Description" style={{ padding: '15px', border: '1px solid #ddd' }}>
                    {complaint.description}
                    {complaint.image_url && (
                      <>
                        <br />
                        <a href={complaint.image_url} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={complaint.image_url}
                            alt="Issue attachment"
                            style={{ maxWidth: '150px', marginTop: '8px', cursor: 'pointer', borderRadius: '6px' }}
                          />
                        </a>
                      </>
                    )}
                  </td>

                  <td className="td1" data-label="Status" style={{ padding: '15px', border: '1px solid #ddd' }}>
                    <span
                      className="badge"
                      style={{
                        background: complaint.status === 'Resolved' ? '#2e7d32' : complaint.status === 'In Progress' ? '#1976d2' : '#ffa000',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        display: 'inline-block',
                      }}
                    >
                      {complaint.status}
                    </span>
                    <br />
                    <button
                      type="button"
                      onClick={() => handleDelete(complaint.id)}
                      className="delete-btn"
                      style={{
                        background: '#ffeded',
                        color: '#d93025',
                        padding: '5px 10px',
                        borderRadius: '5px',
                        fontSize: '11px',
                        border: 'none',
                        cursor: 'pointer',
                        marginTop: '10px',
                        display: 'inline-block',
                      }}
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
