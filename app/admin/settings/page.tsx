import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

export const metadata = {
  title: 'General Settings | CITK Admin',
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/admin/settings')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, username, email')
    .eq('id', user.id)
    .single()

  // Strict server-side admin check
  if (profile?.role !== 'admin') {
    redirect('/student/dashboard')
  }

  const params = await searchParams
  const errorMsg = params.error
  const successMsg = params.success

  // Fetch admin and warden emails
  const { data: adminEmails } = await supabase
    .from('admin_emails')
    .select('*')
    .order('created_at', { ascending: true })

  const { data: wardenEmails } = await supabase
    .from('warden_emails')
    .select('*')
    .order('created_at', { ascending: true })

  // --- SERVER ACTION: Add Admin Email ---
  async function addAdminAction(formData: FormData) {
    'use server'
    const rawEmail = formData.get('email')
    if (!rawEmail || typeof rawEmail !== 'string') {
      redirect('/admin/settings?error=' + encodeURIComponent('Please provide a valid email address.'))
    }

    const email = rawEmail.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      redirect('/admin/settings?error=' + encodeURIComponent('Invalid email format.'))
    }

    const adminClient = createAdminClient()

    // Duplicate check
    const { data: existing } = await adminClient
      .from('admin_emails')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      redirect('/admin/settings?error=' + encodeURIComponent(`Email "${email}" is already registered as an admin.`))
    }

    const { error: insertError } = await adminClient.from('admin_emails').insert({
      email,
    })

    if (insertError) {
      redirect('/admin/settings?error=' + encodeURIComponent(insertError.message))
    }

    revalidatePath('/admin/settings')
    redirect('/admin/settings?success=' + encodeURIComponent(`Admin email "${email}" added successfully.`))
  }

  // --- SERVER ACTION: Remove Admin Email with Safeguard ---
  async function removeAdminAction(formData: FormData) {
    'use server'
    const id = formData.get('id')
    if (!id) return

    const adminClient = createAdminClient()

    // Safeguard: Check remaining count
    const { count, error: countError } = await adminClient
      .from('admin_emails')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      redirect('/admin/settings?error=' + encodeURIComponent('Error validating admin count.'))
    }

    if (count !== null && count <= 1) {
      redirect(
        '/admin/settings?error=' +
          encodeURIComponent(
            'Safeguard Block: Cannot remove the last remaining admin email. Total lockout prevention is active.'
          )
      )
    }

    const { error: deleteError } = await adminClient
      .from('admin_emails')
      .delete()
      .eq('id', Number(id))

    if (deleteError) {
      redirect('/admin/settings?error=' + encodeURIComponent(deleteError.message))
    }

    revalidatePath('/admin/settings')
    redirect('/admin/settings?success=' + encodeURIComponent('Admin email removed successfully.'))
  }

  // --- SERVER ACTION: Add Warden Email ---
  async function addWardenAction(formData: FormData) {
    'use server'
    const rawEmail = formData.get('email')
    if (!rawEmail || typeof rawEmail !== 'string') {
      redirect('/admin/settings?error=' + encodeURIComponent('Please provide a valid email address.'))
    }

    const email = rawEmail.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      redirect('/admin/settings?error=' + encodeURIComponent('Invalid email format.'))
    }

    const adminClient = createAdminClient()

    // Duplicate check
    const { data: existing } = await adminClient
      .from('warden_emails')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      redirect('/admin/settings?error=' + encodeURIComponent(`Email "${email}" is already in the warden allowlist.`))
    }

    const { error: insertError } = await adminClient.from('warden_emails').insert({
      email,
    })

    if (insertError) {
      redirect('/admin/settings?error=' + encodeURIComponent(insertError.message))
    }

    revalidatePath('/admin/settings')
    redirect('/admin/settings?success=' + encodeURIComponent(`Warden email "${email}" added successfully.`))
  }

  // --- SERVER ACTION: Remove Warden Email ---
  async function removeWardenAction(formData: FormData) {
    'use server'
    const id = formData.get('id')
    if (!id) return

    const adminClient = createAdminClient()
    const { error: deleteError } = await adminClient
      .from('warden_emails')
      .delete()
      .eq('id', Number(id))

    if (deleteError) {
      redirect('/admin/settings?error=' + encodeURIComponent(deleteError.message))
    }

    revalidatePath('/admin/settings')
    redirect('/admin/settings?success=' + encodeURIComponent('Warden email removed successfully.'))
  }

  return (
    <div style={{ maxWidth: '1050px', margin: '30px auto', padding: '0 20px', minHeight: '75vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ color: '#1b5e20', fontSize: '26px', margin: '0 0 6px 0' }}>General Settings</h1>
          <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
            Manage privileged user allowlists (Admins &amp; Wardens) and system access controls.
          </p>
        </div>

        <Link
          href="/admin/dashboard"
          style={{
            padding: '8px 16px',
            background: '#e8f5e9',
            color: '#2e7d32',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '13px',
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', color: '#c62828', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', color: '#2e7d32', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          <i className="fa-solid fa-circle-check" style={{ marginRight: '8px' }}></i>
          {successMsg}
        </div>
      )}

      {/* Two Management Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '25px' }}>
        
        {/* PANEL 1: Manage Admins */}
        <section style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <i className="fa-solid fa-user-shield" style={{ fontSize: '20px', color: '#2e7d32' }}></i>
            <h2 style={{ fontSize: '18px', color: '#1b5e20', margin: 0 }}>Manage Admins</h2>
          </div>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 15px' }}>
            Users with emails listed here will automatically receive <strong>Admin</strong> privileges upon signup (bypassing student @cit.ac.in restriction).
          </p>

          {/* Add Admin Form */}
          <form action={addAdminAction} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="email"
              name="email"
              required
              placeholder="Enter new admin email address"
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                background: '#2e7d32',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Add Admin
            </button>
          </form>

          {/* Admin Email List */}
          <h4 style={{ fontSize: '13px', color: '#555', textTransform: 'uppercase', marginBottom: '10px' }}>
            Current Admin Allowlists ({adminEmails?.length || 0})
          </h4>

          <div style={{ border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
            {adminEmails && adminEmails.length > 0 ? (
              adminEmails.map((adm) => (
                <div
                  key={adm.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    background: '#fafafa',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: '#333', fontSize: '14px' }}>{adm.email}</span>
                    <br />
                    <small style={{ color: '#888', fontSize: '11px' }}>
                      Added: {new Date(adm.created_at).toLocaleDateString()}
                    </small>
                  </div>

                  <form action={removeAdminAction}>
                    <input type="hidden" name="id" value={adm.id} />
                    <button
                      type="submit"
                      disabled={adminEmails.length <= 1}
                      title={adminEmails.length <= 1 ? 'Cannot remove the last remaining admin' : 'Remove admin email'}
                      style={{
                        background: adminEmails.length <= 1 ? '#e0e0e0' : '#ffebee',
                        color: adminEmails.length <= 1 ? '#9e9e9e' : '#d32f2f',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: adminEmails.length <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      Remove
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <p style={{ padding: '15px', margin: 0, color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
                No admin emails configured.
              </p>
            )}
          </div>

          <div style={{ marginTop: '12px', fontSize: '12px', color: '#888' }}>
            <i className="fa-solid fa-lock" style={{ marginRight: '5px' }}></i>
            <strong>Safeguard:</strong> The system strictly prevents removing the last admin email.
          </div>
        </section>

        {/* PANEL 2: Manage Wardens */}
        <section style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <i className="fa-solid fa-building-shield" style={{ fontSize: '20px', color: '#1976d2' }}></i>
            <h2 style={{ fontSize: '18px', color: '#0d47a1', margin: 0 }}>Manage Wardens</h2>
          </div>
          <p style={{ fontSize: '13px', color: '#666', margin: '0 0 15px' }}>
            Users with emails listed here will automatically be granted <strong>Warden</strong> permissions upon signup.
          </p>

          {/* Add Warden Form */}
          <form action={addWardenAction} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="email"
              name="email"
              required
              placeholder="Enter new warden email address"
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                background: '#1976d2',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              Add Warden
            </button>
          </form>

          {/* Warden Email List */}
          <h4 style={{ fontSize: '13px', color: '#555', textTransform: 'uppercase', marginBottom: '10px' }}>
            Current Warden Allowlists ({wardenEmails?.length || 0})
          </h4>

          <div style={{ border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
            {wardenEmails && wardenEmails.length > 0 ? (
              wardenEmails.map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    background: '#fafafa',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: '#333', fontSize: '14px' }}>{w.email}</span>
                    <br />
                    <small style={{ color: '#888', fontSize: '11px' }}>
                      Added: {new Date(w.created_at).toLocaleDateString()}
                    </small>
                  </div>

                  <form action={removeWardenAction}>
                    <input type="hidden" name="id" value={w.id} />
                    <button
                      type="submit"
                      style={{
                        background: '#ffebee',
                        color: '#d32f2f',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      Remove
                    </button>
                  </form>
                </div>
              ))
            ) : (
              <p style={{ padding: '15px', margin: 0, color: '#999', fontSize: '13px', fontStyle: 'italic' }}>
                No warden emails configured yet.
              </p>
            )}
          </div>
        </section>

      </div>
    </div>
  )
}
