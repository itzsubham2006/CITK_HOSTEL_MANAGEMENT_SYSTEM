'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AnalyticsPage() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadComplaints() {
      setLoading(true)
      try {
        const { data, error } = await supabase.from('complaints').select('*')
        if (error) throw error
        setComplaints(data || [])
      } catch (err) {
        console.error('Analytics load error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadComplaints()
  }, [])

  const totalIssues = complaints.length
  const totalUpvotes = complaints.reduce((sum, c) => sum + (c.upvotes || 0), 0)
  const pendingCount = complaints.filter((c) => c.status === 'Pending').length
  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length
  const inProgressCount = complaints.filter((c) => c.status === 'In Progress').length

  // Category counts
  const categoryMap: Record<string, number> = {}
  complaints.forEach((c) => {
    categoryMap[c.category] = (categoryMap[c.category] || 0) + 1
  })

  const topIssues = [...complaints]
    .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
    .slice(0, 5)

  return (
    <div className="analytics-wrapper" style={{ marginBottom: '50px' }}>
      <h2 className="analytics-title">Hostel Issue Analytics</h2>

      {/* STATS */}
      <div className="analytics-cards">
        <div className="stat-card green">
          <h3>Total Issues</h3>
          <p id="total-issues">{totalIssues}</p>
        </div>

        <div className="stat-card blue">
          <h3>Total Upvotes</h3>
          <p id="total-upvotes">{totalUpvotes}</p>
        </div>

        <div className="stat-card orange">
          <h3>Pending</h3>
          <p id="pending-count">{pendingCount}</p>
        </div>

        <div className="stat-card success">
          <h3>Resolved</h3>
          <p id="resolved-count">{resolvedCount}</p>
        </div>
      </div>

      {/* CHARTS */}
      <div className="charts-grid">
        <div className="chart-box">
          <h4>Issue Status</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                <span>Pending ({pendingCount})</span>
                <span>{totalIssues > 0 ? Math.round((pendingCount / totalIssues) * 100) : 0}%</span>
              </div>
              <div style={{ height: '10px', background: '#eee', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#ffa000', width: `${totalIssues > 0 ? (pendingCount / totalIssues) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                <span>In Progress ({inProgressCount})</span>
                <span>{totalIssues > 0 ? Math.round((inProgressCount / totalIssues) * 100) : 0}%</span>
              </div>
              <div style={{ height: '10px', background: '#eee', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#1976d2', width: `${totalIssues > 0 ? (inProgressCount / totalIssues) * 100 : 0}%` }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                <span>Resolved ({resolvedCount})</span>
                <span>{totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 0}%</span>
              </div>
              <div style={{ height: '10px', background: '#eee', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#2e7d32', width: `${totalIssues > 0 ? (resolvedCount / totalIssues) * 100 : 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-box">
          <h4>Issues by Category</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            {Object.keys(categoryMap).length === 0 ? (
              <p style={{ color: '#888', fontSize: '13px' }}>No categories recorded yet</p>
            ) : (
              Object.entries(categoryMap).map(([category, count]) => {
                const percentage = totalIssues > 0 ? Math.round((count / totalIssues) * 100) : 0
                return (
                  <div key={category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
                      <span>{category} ({count})</span>
                      <span>{percentage}%</span>
                    </div>
                    <div style={{ height: '10px', background: '#eee', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#2e7d32', width: `${percentage}%` }}></div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* TOP ISSUES */}
      <div className="top-issues">
        <h4>🔥 Most Upvoted Issues</h4>
        <ul id="top-issues-list" style={{ listStyle: 'none', padding: 0 }}>
          {topIssues.length === 0 ? (
            <p style={{ color: '#888', fontSize: '13px' }}>No issues reported yet</p>
          ) : (
            topIssues.map((issue) => (
              <li
                key={issue.id}
                style={{
                  padding: '12px 15px',
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>[{issue.category}]</span> {issue.description}
                  <small style={{ display: 'block', color: '#888' }}>Hostel: {issue.hostel} • Status: {issue.status}</small>
                </div>
                <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }}>
                  👍 {issue.upvotes}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
