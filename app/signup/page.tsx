'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HostelName } from '@/types/database.types'

const hostels: HostelName[] = ['SNM', 'SJ', 'JD', 'BJ', 'Bakhungri', 'Gambari']

function SignupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')

  // Step state: 1 = Enter details, 2 = Verify 6-digit OTP
  const [step, setStep] = useState<1 | 2>(1)

  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [hostel, setHostel] = useState<HostelName | 'None'>('SJ')
  const [roomNo, setRoomNo] = useState('')
  const [otp, setOtp] = useState('')

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const supabase = createClient()

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(prev - 1, 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  // Step 1: Submit details and send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code.')
      }

      setSuccessMsg(data.message || 'Verification code sent! Please check your email inbox.')
      setStep(2)
      setResendCooldown(60) // Start 60-second cooldown
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.')
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend code.')
      }

      setSuccessMsg('A new verification code has been dispatched to your email.')
      setResendCooldown(60)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not resend code.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify OTP and complete account registration
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!otp || otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit numeric verification code.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          otp: otp.trim(),
          hostel,
          roomNo: roomNo.trim() || 'None',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed.')
      }

      setSuccessMsg('Verification successful! Logging you in...')

      // Sign the user in on the client to establish active Supabase session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })

      if (signInError) {
        // Fallback to login page if immediate client sign in encounters an issue
        router.push('/login?message=Account created successfully! Please log in.')
        return
      }

      // Check if redirect return-to URL was provided
      if (redirectParam && !redirectParam.startsWith('/login') && !redirectParam.startsWith('/signup')) {
        router.push(redirectParam)
      } else {
        router.push(data.redirectTo || '/student/dashboard')
      }
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-main">
      <div className="citklogo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/cit-logoo.png" alt="CIT Logo" />
      </div>

      <div className="register-box">
        <div className="register2-box">
          <h2>CITK Hostel Portal — Sign Up</h2>

          {error && (
            <p className="error-msg" style={{ color: '#d32f2f', marginBottom: '12px', fontSize: '13px', lineHeight: '1.4' }}>
              {error}
            </p>
          )}

          {successMsg && (
            <p style={{ color: '#2e7d32', marginBottom: '12px', fontSize: '13px', background: '#e8f5e9', padding: '8px 12px', borderRadius: '4px' }}>
              {successMsg}
            </p>
          )}

          {step === 1 ? (
            /* STEP 1: Details Entry */
            <form onSubmit={handleSendOtp}>
              <div className="input-group">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="input-group">
                <input
                  type="email"
                  required
                  placeholder="Email (@cit.ac.in for students)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="input-group">
                <input
                  type="password"
                  required
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="input-group">
                <input
                  type="password"
                  required
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="input-group">
                <select
                  className="register-select"
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value as HostelName | 'None')}
                >
                  <option value="None">Hostel: None (Day-scholar / Staff / Other)</option>
                  {hostels.map((h) => (
                    <option key={h} value={h}>
                      Hostel: {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <input
                  type="text"
                  placeholder="Room No (or 'None' if day-scholar)"
                  value={roomNo}
                  onChange={(e) => setRoomNo(e.target.value)}
                />
              </div>

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? 'Sending Verification Code...' : 'Continue & Verify Email'}
              </button>
            </form>
          ) : (
            /* STEP 2: 6-digit OTP Verification */
            <form onSubmit={handleVerifyOtp}>
              <div style={{ margin: '12px 0', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#555', marginBottom: '14px', lineHeight: '1.4' }}>
                  A 6-digit verification code was sent to:<br />
                  <strong style={{ color: '#2c5aa0', wordBreak: 'break-all' }}>{email}</strong>
                </p>

                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    style={{
                      textAlign: 'center',
                      letterSpacing: otp ? '8px' : 'normal',
                      fontSize: otp ? '22px' : '13px',
                      fontWeight: otp ? 'bold' : 'normal',
                      padding: '10px 14px',
                    }}
                  />
                </div>
              </div>

              <button type="submit" className="register-btn" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Complete Signup'}
              </button>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '14px',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: '12px',
                    textDecoration: 'underline',
                    padding: '4px 0',
                  }}
                >
                  ← Edit details
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? '#999' : '#2e7d32',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '4px 0',
                  }}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          <div className="account-link">
            <Link href={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : '/login'}>
              Already have an account? Log in here
            </Link>
          </div>
        </div>

        <div className="info-panel">
          <h3>Registration Guidelines</h3>
          <hr />

          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 15px 0' }}>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
              <i className="fa-solid fa-envelope" style={{ marginTop: '3px', flexShrink: 0, width: '16px', textAlign: 'center' }}></i>
              <div style={{ flex: 1, lineHeight: '1.4' }}>
                <strong>Students:</strong> Must use official <code style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 5px', borderRadius: '3px', fontSize: '11px', whiteSpace: 'nowrap' }}>@cit.ac.in</code> email.
              </div>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
              <i className="fa-solid fa-shield-halved" style={{ marginTop: '3px', flexShrink: 0, width: '16px', textAlign: 'center' }}></i>
              <div style={{ flex: 1, lineHeight: '1.4' }}>
                <strong>Admins &amp; Wardens:</strong> Role is auto-detected from authorized allowlists.
              </div>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
              <i className="fa-solid fa-key" style={{ marginTop: '3px', flexShrink: 0, width: '16px', textAlign: 'center' }}></i>
              <div style={{ flex: 1, lineHeight: '1.4' }}>
                <strong>Security:</strong> 6-digit OTP verification ensures valid account ownership.
              </div>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
              <i className="fa-solid fa-building-user" style={{ marginTop: '3px', flexShrink: 0, width: '16px', textAlign: 'center' }}></i>
              <div style={{ flex: 1, lineHeight: '1.4' }}>
                <strong>Hostel Details:</strong> Select your hostel or choose <em>None</em> for Day-scholars/Staff.
              </div>
            </li>
          </ul>

          <p className="info-note">
            Verification codes are valid for 10 minutes. Check your inbox and spam/junk folder.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>}>
      <SignupContent />
    </Suspense>
  )
}
