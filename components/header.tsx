'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserRole } from '@/types/database.types'

interface HeaderProps {
  userProfile?: {
    id: string
    username: string
    email: string
    role: UserRole
    hostel: string
    room_no: string
    profile_pic_url: string | null
  } | null
  notificationCount?: number
}

export default function Header({ userProfile, notificationCount = 0 }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openMega, setOpenMega] = useState<string | null>(null)
  const [typingText, setTypingText] = useState('')
  const supabase = createClient()

  // Typing effect from original script
  useEffect(() => {
    const fullText = 'CITK | HOSTEL PORTAL'
    let index = 0
    let timeoutId: NodeJS.Timeout

    function play() {
      if (index <= fullText.length) {
        setTypingText(fullText.slice(0, index))
        index++
        timeoutId = setTimeout(play, 150)
      } else {
        timeoutId = setTimeout(() => {
          index = 0
          play()
        }, 3000)
      }
    }

    play()
    return () => clearTimeout(timeoutId)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const toggleMega = (name: string, e: React.MouseEvent) => {
    e.preventDefault()
    setOpenMega(openMega === name ? null : name)
  }

  return (
    <header>
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-container" style={{ height: '35px' }}>
          <div className="top-left">
            <span id="typing-text">{typingText}</span>
            <span className="cursor">|</span>
          </div>

          <div className="top-right">
            {userProfile ? (
              <>
                <Link href="/profile">
                  <i className="fa-solid fa-user"></i>
                  <span>My Profile ({userProfile.username})</span>
                </Link>
                <button
                  onClick={handleLogout}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', font: 'inherit' }}
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <i className="fa-solid fa-right-to-bracket"></i>
                  <span>Login</span>
                </Link>
                <Link href="/register">
                  <i className="fa-solid fa-user-plus"></i>
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Branding Section */}
      <div className="branding-section">
        <div className="branding-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/citk_logo.png"
            alt="CITK Logo"
            className="main-logo"
          />

          <div className="title-text">
            <h1>सीआईटीके छात्रावास प्रबंधन प्रणाली</h1>
            <h2>CITK HOSTEL MANAGEMENT SYSTEM</h2>
            <p>Deemed to be University under MoE, Govt. of India</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="sp-main-nav">
        <div className="nav-header">
          <button
            className="mobile-menu-toggle"
            aria-label="Open Menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="bar" style={{ margin: '2px 0px' }}></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>

        <ul className={`sp-nav-list ${mobileMenuOpen ? 'is-active' : ''}`}>
          <li className="mobile-only close-row">
            <button className="close-menu" onClick={() => setMobileMenuOpen(false)}>
              &times; Close
            </button>
          </li>

          <li>
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
          </li>

          {userProfile?.role === 'student' && (
            <>
              <li>
                <Link href="/report-issue" onClick={() => setMobileMenuOpen(false)}>
                  Report Issue
                </Link>
              </li>
              <li>
                <Link href="/my-issues" onClick={() => setMobileMenuOpen(false)}>
                  My Reported Issues
                </Link>
              </li>
            </>
          )}

          <li>
            <Link href="/issues" onClick={() => setMobileMenuOpen(false)}>
              All Issues
            </Link>
          </li>

          <li>
            <Link href="/analytics" onClick={() => setMobileMenuOpen(false)}>
              Analytics
            </Link>
          </li>

          {(userProfile?.role === 'admin' || userProfile?.role === 'warden') && (
            <li>
              <Link href="/announcements" onClick={() => setMobileMenuOpen(false)}>
                Announcements
              </Link>
            </li>
          )}

          {/* MEGA MENU: Resources */}
          <li className={`sp-mega-parent ${openMega === 'resources' ? 'is-open active' : ''}`}>
            <a href="#" className="mobile-trigger" onClick={(e) => toggleMega('resources', e)}>
              Resources ▾
            </a>

            <div className="sp-mega-box">
              <div className="sp-mega-left">
                <h4>Hostel Resources</h4>
                <ul>
                  <li>
                    <Link href="/facilities" onClick={() => setMobileMenuOpen(false)}>
                      Hostel Rules & Facilities
                    </Link>
                  </li>
                  <li>
                    <Link href="/schedules" onClick={() => setMobileMenuOpen(false)}>
                      Schedules
                    </Link>
                  </li>
                  <li>
                    <Link href="/hostel-body" onClick={() => setMobileMenuOpen(false)}>
                      Hostel Bodies
                    </Link>
                  </li>
                  <li>
                    <Link href="/wardens" onClick={() => setMobileMenuOpen(false)}>
                      Hostel Wardens
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="sp-mega-right">
                <h4>Others</h4>
                <div className="sp-mega-grid">
                  <Link href="/anti-ragging" onClick={() => setMobileMenuOpen(false)}>
                    Anti Ragging
                  </Link>
                  <Link href="/announcements" onClick={() => setMobileMenuOpen(false)}>
                    Notices
                  </Link>
                </div>
              </div>
            </div>
          </li>

          {/* MEGA MENU: More */}
          <li className={`sp-mega-parent ${openMega === 'more' ? 'is-open active' : ''}`}>
            <a href="#" className="mobile-trigger" onClick={(e) => toggleMega('more', e)}>
              More▾
            </a>

            <div className="sp-mega-box">
              <div className="sp-mega-left">
                <h4>Important</h4>
                <ul>
                  <li>
                    <a href="https://cit.ac.in/pages-uploads-academic-form" target="_blank" rel="noopener noreferrer">
                      Forms
                    </a>
                  </li>
                  <li>
                    <Link href="/hostel-rooms" onClick={() => setMobileMenuOpen(false)}>
                      Hostel Rooms
                    </Link>
                  </li>
                  <li>
                    <Link href="/diaries" onClick={() => setMobileMenuOpen(false)}>
                      Hostel Diaries
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="sp-mega-right">
                <h4>Others</h4>
                <div className="sp-mega-grid">
                  <Link href="/organizational-structure" onClick={() => setMobileMenuOpen(false)}>
                    Organizational Structure
                  </Link>
                  <Link href="/facilities" onClick={() => setMobileMenuOpen(false)}>
                    Hostel Facility
                  </Link>
                  <Link href="/help" onClick={() => setMobileMenuOpen(false)}>
                    Help
                  </Link>
                  <Link href="/feedback" onClick={() => setMobileMenuOpen(false)}>
                    Send Feedback
                  </Link>
                </div>
              </div>
            </div>
          </li>

          <li>
            <Link href="/notifications" className="sp-badge-link" onClick={() => setMobileMenuOpen(false)}>
              Notifications {notificationCount > 0 && <span className="sp-badge">{notificationCount}</span>}
            </Link>
          </li>

          <li>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
              About
            </Link>
          </li>

          <li className="nav-item">
            <Link href="/chatbot" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Hostel Bot
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
