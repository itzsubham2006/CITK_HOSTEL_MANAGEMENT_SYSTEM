import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = {
  title: 'Admin Dashboard | CITK Hostel Management',
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/admin/dashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/student/dashboard')
  }

  // Fetch metrics
  const { count: totalComplaints } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true })

  const { count: pendingComplaints } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Pending')

  const { count: resolvedComplaints } = await supabase
    .from('complaints')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Resolved')

  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')

  const { count: adminCount } = await supabase
    .from('admin_emails')
    .select('*', { count: 'exact', head: true })

  const { count: wardenCount } = await supabase
    .from('warden_emails')
    .select('*', { count: 'exact', head: true })

  return (
    <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 20px', minHeight: '70vh' }}>
      <div style={{ background: '#d7e6d0', padding: '24px', borderRadius: '12px', marginBottom: '30px', borderLeft: '6px solid #2e7d32', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ color: '#1b5e20', fontSize: '26px', margin: '0 0 8px 0' }}>
            System Administration Dashboard
          </h1>
          <p style={{ margin: 0, color: '#333', fontSize: '15px' }}>
            Administrator: <strong>{profile?.username}</strong> ({profile?.email})
          </p>
        </div>

        {/* Link to General Settings (Feature 5) */}
        <Link
          href="/admin/settings"
          style={{
            background: '#2e7d32',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
        >
          <i className="fa-solid fa-gear"></i>
          General Settings
        </Link>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '35px' }}>
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 8px', color: '#666', fontSize: '14px', textTransform: 'uppercase' }}>Total Issues</h4>
          <span style={{ fontSize: '32px', fontWeight: 800, color: '#2e7d32' }}>{totalComplaints || 0}</span>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 8px', color: '#666', fontSize: '14px', textTransform: 'uppercase' }}>Pending Issues</h4>
          <span style={{ fontSize: '32px', fontWeight: 800, color: '#d32f2f' }}>{pendingComplaints || 0}</span>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 8px', color: '#666', fontSize: '14px', textTransform: 'uppercase' }}>Resolved Issues</h4>
          <span style={{ fontSize: '32px', fontWeight: 800, color: '#388e3c' }}>{resolvedComplaints || 0}</span>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
          <h4 style={{ margin: '0 0 8px', color: '#666', fontSize: '14px', textTransform: 'uppercase' }}>Registered Students</h4>
          <span style={{ fontSize: '32px', fontWeight: 800, color: '#1976d2' }}>{totalStudents || 0}</span>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '24px' }}>
          <h3 style={{ color: '#2e7d32', marginTop: 0, fontSize: '18px' }}>
            <i className="fa-solid fa-users-gear" style={{ marginRight: '8px' }}></i>
            Role Allowlists
          </h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Active pre-approved emails: <strong>{adminCount || 1}</strong> Admin(s), <strong>{wardenCount || 0}</strong> Warden(s).
          </p>
          <Link
            href="/admin/settings"
            style={{
              display: 'inline-block',
              marginTop: '10px',
              padding: '8px 16px',
              background: '#e8f5e9',
              color: '#2e7d32',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            Configure Admin &amp; Warden Allowlists →
          </Link>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '24px' }}>
          <h3 style={{ color: '#2e7d32', marginTop: 0, fontSize: '18px' }}>
            <i className="fa-solid fa-bullhorn" style={{ marginRight: '8px' }}></i>
            Broadcast &amp; Rooms
          </h3>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Manage room allocations, publish institute-wide announcements, or review analytics.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
            <Link
              href="/notifications"
              style={{
                padding: '6px 12px',
                background: '#e8f5e9',
                color: '#2e7d32',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '13px',
              }}
            >
              <i className="fa-solid fa-bell" style={{ marginRight: '4px' }}></i> Notifications
            </Link>
            <Link
              href="/announcements"
              style={{
                padding: '6px 12px',
                background: '#f5f5f5',
                color: '#333',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '13px',
              }}
            >
              Announcements
            </Link>
            <Link
              href="/hostel-rooms"
              style={{
                padding: '6px 12px',
                background: '#f5f5f5',
                color: '#333',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '13px',
              }}
            >
              Hostel Rooms
            </Link>
            <Link
              href="/analytics"
              style={{
                padding: '6px 12px',
                background: '#f5f5f5',
                color: '#333',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: '13px',
              }}
            >
              Analytics
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
