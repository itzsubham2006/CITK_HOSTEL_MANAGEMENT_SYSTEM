'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, LogOut, User, Menu, X, ShieldAlert, Sparkles, Building2 } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserRole, HostelName } from '@/types/database.types'

interface NavbarProps {
  userProfile?: {
    id: string
    username: string
    email: string
    hostel: HostelName
    room_no: string
    role: UserRole
    profile_pic_url: string | null
  } | null
  unreadNotificationsCount?: number
}

export default function Navbar({ userProfile, unreadNotificationsCount = 0 }: NavbarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-lg text-zinc-900 dark:text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                CITK Hostel
              </span>
              <span className="text-xs block font-medium text-zinc-500 dark:text-zinc-400">Issue Management</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {userProfile && (
            <div className="hidden lg:flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Hostel: {userProfile.hostel}</span>
              <span>•</span>
              <span>Room: {userProfile.room_no}</span>
              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-indigo-700 uppercase dark:bg-indigo-900/50 dark:text-indigo-300 font-bold">
                {userProfile.role}
              </span>
            </div>
          )}

          <Link
            href="/notifications"
            className="relative rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-950">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </Link>

          <Link
            href="/chatbot"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
            title="AI Assistant"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Helper</span>
          </Link>

          {userProfile ? (
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg p-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold dark:bg-indigo-900 dark:text-indigo-300 overflow-hidden border border-indigo-200 dark:border-indigo-800">
                  {userProfile.profile_pic_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userProfile.profile_pic_url} alt={userProfile.username} className="h-full w-full object-cover" />
                  ) : (
                    userProfile.username.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="hidden md:inline font-semibold">{userProfile.username}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
