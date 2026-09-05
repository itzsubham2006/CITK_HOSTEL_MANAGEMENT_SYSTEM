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
    hostel?: string | null
    room_no?: string | null
    profile_pic_url: string | null
    created_at?: string
    updated_at?: string
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

  const closeAllMenus = () => {
    setOpenMega(null)
    setMobileMenuOpen(false)
  }

  useEffect(() => {
    if (!mobileMenuOpen) {
      setOpenMega(null)
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    closeAllMenus()
  }, [pathname])

  const toggleMega = (name: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpenMega((prev) => (prev === name ? null : name))
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
                {userProfile.role === 'admin' && (
                  <Link href="/admin/dashboard">
                    <i className="fa-solid fa-gauge-high"></i>
                    <span>Dashboard</span>
                  </Link>
                )}
                {userProfile.role === 'warden' && (
                  <Link href="/warden/dashboard">
                    <i className="fa-solid fa-gauge-high"></i>
                    <span>Dashboard</span>
                  </Link>
                )}
                {userProfile.role === 'student' && (
                  <Link href="/student/dashboard">
                    <i className="fa-solid fa-gauge-high"></i>
                    <span>Dashboard</span>
                  </Link>
                )}
                <Link href="/profile">
                  <i className="fa-solid fa-user"></i>
                  <span>Profile ({userProfile.username})</span>
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
                <Link href="/signup">
                  <i className="fa-solid fa-user-plus"></i>
                  <span>Sign Up</span>
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
            onClick={() => {
              if (mobileMenuOpen) {
                closeAllMenus()
              } else {
                setMobileMenuOpen(true)
              }
            }}
          >
            <span className="bar" style={{ margin: '2px 0px' }}></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>

        <ul className={`sp-nav-list ${mobileMenuOpen ? 'is-active' : ''}`}>
          <li className="mobile-only close-row">
            <button className="close-menu" onClick={closeAllMenus}>
              &times; Close
            </button>
          </li>

          <li>
            <Link href="/" onClick={closeAllMenus}>
              Home
            </Link>
          </li>

          {userProfile?.role === 'student' && (
            <>
              <li>
                <Link href="/report-issue" onClick={closeAllMenus}>
                  Report Issue
                </Link>
              </li>
              <li>
                <Link href="/my-issues" onClick={closeAllMenus}>
                  My Reported Issues
                </Link>
              </li>
            </>
          )}

          <li>
            <Link href={userProfile ? "/issues" : "/login?redirect=/issues"} onClick={closeAllMenus}>
              All Issues
            </Link>
          </li>

          <li>
            <Link href={userProfile ? "/analytics" : "/login?redirect=/analytics"} onClick={closeAllMenus}>
              Analytics
            </Link>
          </li>

          {(userProfile?.role === 'admin' || userProfile?.role === 'warden') && (
            <li>
              <Link href="/announcements" onClick={closeAllMenus}>
                Announcements
              </Link>
            </li>
          )}

          {/* MEGA MENU: Resources */}
          <li className={`sp-mega-parent ${openMega === 'resources' ? 'is-open active' : ''}`}>
            <a href="#" className="mobile-trigger" onClick={(e) => toggleMega('resources', e)}>
              Resources {openMega === 'resources' ? '▲' : '▼'}
            </a>

            <div className="sp-mega-box">
              <div className="sp-mega-header-mobile">
                <span className="sp-mega-title">
                  <i className="fa-solid fa-compass" style={{ marginRight: '6px' }}></i>
                  Hostel Resources
                </span>
                <button
                  type="button"
                  className="sp-mega-close"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setOpenMega(null)
                  }}
                  aria-label="Close submenu"
                >
                  &times; Close
                </button>
              </div>

              <div className="sp-mega-left">
                <h4>Hostel Resources</h4>
                <ul>
                  <li>
                    <Link href="/facilities" onClick={closeAllMenus}>
                      Hostel Rules &amp; Facilities
                    </Link>
                  </li>
                  <li>
                    <Link href="/schedules" onClick={closeAllMenus}>
                      Schedules
                    </Link>
                  </li>
                  <li>
                    <Link href="/hostel-body" onClick={closeAllMenus}>
                      Hostel Bodies
                    </Link>
                  </li>
                  <li>
                    <Link href="/wardens" onClick={closeAllMenus}>
                      Hostel Wardens
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="sp-mega-right">
                <h4>Others</h4>
                <div className="sp-mega-grid">
                  <Link href="/anti-ragging" onClick={closeAllMenus}>
                    Anti Ragging
                  </Link>
                  <Link href="/announcements" onClick={closeAllMenus}>
                    Notices
                  </Link>
                </div>
              </div>
            </div>
          </li>

          {/* MEGA MENU: More */}
          <li className={`sp-mega-parent ${openMega === 'more' ? 'is-open active' : ''}`}>
            <a href="#" className="mobile-trigger" onClick={(e) => toggleMega('more', e)}>
              More {openMega === 'more' ? '▲' : '▼'}
            </a>

            <div className="sp-mega-box">
              <div className="sp-mega-header-mobile">
                <span className="sp-mega-title">
                  <i className="fa-solid fa-layer-group" style={{ marginRight: '6px' }}></i>
                  More Options
                </span>
                <button
                  type="button"
                  className="sp-mega-close"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setOpenMega(null)
                  }}
                  aria-label="Close submenu"
                >
                  &times; Close
                </button>
              </div>

              <div className="sp-mega-left">
                <h4>Important</h4>
                <ul>
                  <li>
                    <a href="https://cit.ac.in/pages-uploads-academic-form" target="_blank" rel="noopener noreferrer" onClick={closeAllMenus}>
                      Forms
                    </a>
                  </li>
                  {(userProfile?.role === 'admin' || userProfile?.role === 'warden') && (
                    <li>
                      <Link href="/hostel-rooms" onClick={closeAllMenus}>
                        Hostel Rooms
                      </Link>
                    </li>
                  )}
                  <li>
                    <Link href={userProfile ? "/diaries" : "/login?redirect=/diaries"} onClick={closeAllMenus}>
                      Hostel Diaries
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="sp-mega-right">
                <h4>Others</h4>
                <div className="sp-mega-grid">
                  <Link href="/organizational-structure" onClick={closeAllMenus}>
                    Organizational Structure
                  </Link>
                  <Link href="/facilities" onClick={closeAllMenus}>
                    Hostel Facility
                  </Link>
                  <Link href="/help" onClick={closeAllMenus}>
                    Help
                  </Link>
                  <Link href="/feedback" onClick={closeAllMenus}>
                    Send Feedback
                  </Link>
                </div>
              </div>
            </div>
          </li>

          <li>
            <Link href={userProfile ? "/notifications" : "/login?redirect=/notifications"} className="sp-badge-link" onClick={closeAllMenus}>
              Notifications {notificationCount > 0 && <span className="sp-badge">{notificationCount}</span>}
            </Link>
          </li>

          <li>
            <Link href="/about" onClick={closeAllMenus}>
              About
            </Link>
          </li>

          <li className="nav-item">
            <Link href={userProfile ? "/chatbot" : "/login?redirect=/chatbot"} className="nav-link" onClick={closeAllMenus}>
              Hostel Bot
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
