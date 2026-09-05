import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HostelName } from '@/types/database.types'
import { revalidatePath } from 'next/cache'

export const metadata = {
  title: 'Warden Dashboard | CITK Hostel Management',
}

const hostels: HostelName[] = ['SNM', 'SJ', 'JD', 'BJ', 'Bakhungri', 'Gambari']

export default async function WardenDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ hostel?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/warden/dashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, username')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'warden' && profile?.role !== 'admin') {
    redirect('/student/dashboard')
  }

  const params = await searchParams
  const selectedHostel = params.hostel as HostelName | undefined

  let query = supabase.from('complaints').select('*, profiles(username, room_no)').order('created_at', { ascending: false })

  if (selectedHostel) {
    query = query.eq('hostel', selectedHostel)
  }

  const { data: complaints } = await query

  async function updateStatus(formData: FormData) {
    'use server'
    const id = formData.get('complaintId')
    const status = formData.get('status')
    if (!id || !status) return

    const s = await createClient()
    await s
      .from('complaints')
      .update({ status: status as 'Pending' | 'In Progress' | 'Resolved' })
      .eq('id', Number(id))

    revalidatePath('/warden/dashboard')
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 20px', minHeight: '70vh' }}>
      <div style={{ background: '#d7e6d0', padding: '24px', borderRadius: '12px', marginBottom: '30px', borderLeft: '6px solid #2e7d32' }}>
        <h1 style={{ color: '#1b5e20', fontSize: '26px', margin: '0 0 8px 0' }}>
          Warden Management Dashboard
        </h1>
        <p style={{ margin: 0, color: '#333', fontSize: '15px' }}>
          Logged in as <strong>{profile?.username}</strong> | Role: <span style={{ textTransform: 'capitalize', color: '#2e7d32', fontWeight: 600 }}>{profile?.role}</span>
        </p>
      </div>

      {/* Quick Nav Bar */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '25px' }}>
        <Link href="/notifications" style={{ padding: '8px 16px', background: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9', textDecoration: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}>
          <i className="fa-solid fa-bell" style={{ marginRight: '6px' }}></i>
          Notifications
        </Link>
        <Link href="/hostel-rooms" style={{ padding: '8px 16px', background: '#2e7d32', color: '#fff', textDecoration: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}>
          Manage Hostel Rooms
        </Link>
        <Link href="/announcements" style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', textDecoration: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}>
          Publish Notice
        </Link>
        <Link href="/analytics" style={{ padding: '8px 16px', background: '#e0e0e0', color: '#333', textDecoration: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}>
          View Analytics
        </Link>
      </div>

      {/* Hostel Filter Form */}
      <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '25px' }}>
        <form method="get" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontWeight: 600, color: '#333', fontSize: '14px' }}>Filter by Hostel:</label>
          <select
            name="hostel"
            defaultValue={selectedHostel || ''}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none' }}
          >
            <option value="">All Hostels</option>
            {hostels.map((h) => (
              <option key={h} value={h}>
                {h} Hostel
              </option>
            ))}
          </select>
          <button
            type="submit"
            style={{ padding: '8px 16px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            Apply Filter
          </button>
        </form>
      </div>

      {/* Complaints List */}
      <h2 style={{ fontSize: '20px', color: '#2e7d32', marginBottom: '15px' }}>
        Complaints List {selectedHostel ? `(${selectedHostel})` : '(All Hostels)'}
      </h2>

      {complaints && complaints.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {complaints.map((c) => (
            <div
              key={c.id}
              style={{
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px',
              }}
            >
              <div style={{ flex: 1, minWidth: '260px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, color: '#2e7d32' }}>{c.category}</span>
                  <span style={{ fontSize: '12px', background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                    {c.hostel} Hostel
                  </span>
                  <span style={{ fontSize: '12px', color: '#777' }}>
                    Room: {c.profiles?.room_no || 'N/A'} (by {c.profiles?.username || 'Student'})
                  </span>
                </div>
                <p style={{ margin: '0 0 8px', color: '#444', fontSize: '14px', lineHeight: '1.4' }}>
                  {c.description}
                </p>
                <small style={{ color: '#888' }}>
                  Reported: {new Date(c.created_at).toLocaleDateString()} | Upvotes: {c.upvotes}
                </small>
              </div>

              {/* Status Update Form */}
              <form action={updateStatus} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="hidden" name="complaintId" value={c.id} />
                <select
                  name="status"
                  defaultValue={c.status}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #ccc',
                    fontWeight: 600,
                    color: c.status === 'Resolved' ? '#2e7d32' : c.status === 'In Progress' ? '#f57c00' : '#d32f2f',
                  }}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
                <button
                  type="submit"
                  style={{
                    padding: '6px 12px',
                    background: '#2e7d32',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  Update
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: '#777', fontStyle: 'italic' }}>No complaints found matching this criteria.</p>
      )}
    </div>
  )
}
