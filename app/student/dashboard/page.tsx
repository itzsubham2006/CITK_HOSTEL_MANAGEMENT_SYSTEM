import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Student Dashboard | CITK Hostel Management',
}

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/student/dashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const hostel = profile?.hostel || 'SJ'

  // Fetch student's recent complaints
  const { data: myComplaints } = await supabase
    .from('complaints')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch active hostel complaints
  const { data: hostelComplaints } = await supabase
    .from('complaints')
    .select('*')
    .eq('hostel', hostel)
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 20px', minHeight: '70vh' }}>
      <div style={{ background: '#d7e6d0', padding: '24px', borderRadius: '12px', marginBottom: '30px', borderLeft: '6px solid #2e7d32' }}>
        <h1 style={{ color: '#1b5e20', fontSize: '26px', margin: '0 0 8px 0' }}>
          Welcome, {profile?.username || 'Student'}!
        </h1>
        <p style={{ margin: 0, color: '#333', fontSize: '15px' }}>
          Hostel: <strong>{hostel}</strong> | Room: <strong>{profile?.room_no || 'N/A'}</strong> | Role: <span style={{ textTransform: 'capitalize', color: '#2e7d32', fontWeight: 600 }}>Student</span>
        </p>
      </div>

      {/* Quick Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '35px' }}>
        <Link href="/report-issue" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#fff', border: '1px solid #c8e6c9', borderRadius: '10px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: '0.2s' }}>
            <div style={{ fontSize: '30px', color: '#2e7d32', marginBottom: '10px' }}>
              <i className="fa-solid fa-circle-plus"></i>
            </div>
            <h3 style={{ margin: '0 0 6px', color: '#2e7d32', fontSize: '17px' }}>Report Issue</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>File a new maintenance grievance</p>
          </div>
        </Link>

        <Link href="/my-issues" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#fff', border: '1px solid #c8e6c9', borderRadius: '10px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: '0.2s' }}>
            <div style={{ fontSize: '30px', color: '#2e7d32', marginBottom: '10px' }}>
              <i className="fa-solid fa-list-check"></i>
            </div>
            <h3 style={{ margin: '0 0 6px', color: '#2e7d32', fontSize: '17px' }}>My Complaints</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>Track status of your complaints ({myComplaints?.length || 0})</p>
          </div>
        </Link>

        <Link href="/issues" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#fff', border: '1px solid #c8e6c9', borderRadius: '10px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: '0.2s' }}>
            <div style={{ fontSize: '30px', color: '#2e7d32', marginBottom: '10px' }}>
              <i className="fa-solid fa-bullhorn"></i>
            </div>
            <h3 style={{ margin: '0 0 6px', color: '#2e7d32', fontSize: '17px' }}>Community Issues</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>View and upvote hostel issues</p>
          </div>
        </Link>

        <Link href="/chatbot" style={{ textDecoration: 'none' }}>
          <div style={{ background: '#fff', border: '1px solid #c8e6c9', borderRadius: '10px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: '0.2s' }}>
            <div style={{ fontSize: '30px', color: '#2e7d32', marginBottom: '10px' }}>
              <i className="fa-solid fa-robot"></i>
            </div>
            <h3 style={{ margin: '0 0 6px', color: '#2e7d32', fontSize: '17px' }}>Hostel Bot</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>Ask questions about mess &amp; hostel</p>
          </div>
        </Link>
      </div>

      {/* Recent Hostel Issues */}
      <section style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '25px', marginBottom: '30px' }}>
        <h2 style={{ color: '#2e7d32', fontSize: '20px', marginBottom: '16px' }}>
          Recent Issues in {hostel} Hostel
        </h2>

        {hostelComplaints && hostelComplaints.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            {hostelComplaints.map((c) => (
              <div
                key={c.id}
                style={{
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  padding: '15px',
                  background: '#fafafa',
                  borderLeft: `4px solid ${
                    c.status === 'Resolved' ? '#2e7d32' : c.status === 'In Progress' ? '#f57c00' : '#d32f2f'
                  }`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#333' }}>{c.category}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 'bold',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      backgroundColor: c.status === 'Resolved' ? '#e8f5e9' : c.status === 'In Progress' ? '#fff3e0' : '#ffebee',
                      color: c.status === 'Resolved' ? '#2e7d32' : c.status === 'In Progress' ? '#f57c00' : '#d32f2f',
                    }}
                  >
                    {c.status}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#555', margin: '0 0 8px', lineHeight: '1.4' }}>
                  {c.description}
                </p>
                <small style={{ color: '#888', fontSize: '11px' }}>
                  Upvotes: {c.upvotes} | {new Date(c.created_at).toLocaleDateString()}
                </small>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#777', fontStyle: 'italic', margin: 0 }}>
            No recent issues reported in {hostel} Hostel.
          </p>
        )}
      </section>
    </div>
  )
}
