'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const messageParam = searchParams.get('message')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const cleanEmail = email.trim().toLowerCase()

      // 1. Authenticate with Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (signInError) throw signInError
      if (!data.user) throw new Error('Failed to retrieve user session.')

      // 2. Defense in Depth: Role & Domain Restriction Check at Login (Feature 3)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const userRole = profile?.role || 'student'

      // Check student domain rule
      if (userRole === 'student' && !cleanEmail.endsWith('@cit.ac.in')) {
        await supabase.auth.signOut()
        throw new Error(
          'Access denied: Only @cit.ac.in email addresses are permitted for student accounts. Please contact an administrator.'
        )
      }

      // 3. Return-to URL or Role-Based Dashboard Redirect
      if (redirectParam && !redirectParam.startsWith('/login') && !redirectParam.startsWith('/signup')) {
        router.push(redirectParam)
      } else {
        if (userRole === 'admin') {
          router.push('/admin/dashboard')
        } else if (userRole === 'warden') {
          router.push('/warden/dashboard')
        } else {
          router.push('/student/dashboard')
        }
      }

      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid username or password')
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
          <h2>Welcome to CIT Kokrajhar</h2>

          {messageParam && (
            <p style={{ color: '#2e7d32', marginBottom: '10px', fontSize: '13px', background: '#e8f5e9', padding: '8px 12px', borderRadius: '4px' }}>
              {messageParam}
            </p>
          )}

          {error && (
            <p className="error-msg" style={{ color: '#d32f2f', marginBottom: '10px', fontSize: '13px', lineHeight: '1.4' }}>
              {error}
            </p>
          )}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="remember-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '10px 0' }}>
              <input
                type="checkbox"
                id="remember-me"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label htmlFor="remember-me" style={{ fontSize: '13px', color: '#555', cursor: 'pointer' }}>
                Remember me
              </label>
            </div>

            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="account-link">
            <Link href={redirectParam ? `/signup?redirect=${encodeURIComponent(redirectParam)}` : '/signup'}>
              Didn&apos;t have an account? Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
