'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      router.push('/')
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

          {error && <p className="error-msg" style={{ color: '#d32f2f', marginBottom: '10px' }}>{error}</p>}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input
                type="email"
                required
                placeholder="Email"
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
            <Link href="/register">Didn&apos;t have an account? Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
