'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { HostelName } from '@/types/database.types'

const hostels: HostelName[] = ['SNM', 'SJ', 'JD', 'BJ', 'Bakhungri', 'Gambari']

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [hostel, setHostel] = useState<HostelName>('SJ')
  const [roomNo, setRoomNo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            hostel,
            room_no: roomNo,
            role: 'student',
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.session) {
        router.push('/')
        router.refresh()
      } else {
        router.push('/login?message=Account created! Please login.')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
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

          <form onSubmit={handleRegister}>
            <div className="input-group">
              <input
                type="text"
                required
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

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
                value={hostel}
                onChange={(e) => setHostel(e.target.value as HostelName)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                {hostels.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <input
                type="text"
                required
                placeholder="Room No"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
              />
            </div>

            <button type="submit" className="register-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign up'}
            </button>
          </form>

          <div className="account-link">
            <Link href="/login">Already have an account? Click here</Link>
          </div>
        </div>

        <div className="info-panel">
          <h3>Signup Instructions</h3>
          <hr />

          <ul>
            <li><i className="fa-solid fa-user"></i> Username: Min 4 characters</li>
            <li><i className="fa-solid fa-envelope"></i> Valid college email address</li>
            <li><i className="fa-solid fa-key"></i> Password: Min 6 unique characters</li>
            <li><i className="fa-solid fa-building-user"></i> Correct hostel & room</li>
            <li><i className="fa-solid fa-key"></i> Please remember your password to login again.</li>
          </ul>

          <p className="info-note">
            These details help hostel authorities contact you for maintenance or notices.
          </p>
        </div>
      </div>
    </div>
  )
}
