'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  AlertCircle,
  PlusCircle,
  Megaphone,
  Camera,
  Grid,
  BarChart3,
  Bot,
  ShieldAlert,
  Info,
  Building,
  Calendar,
  MessageSquare,
  User,
  ListTodo
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserRole } from '@/types/database.types'

interface SidebarProps {
  role?: UserRole
}

export default function Sidebar({ role = 'student' }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    {
      title: 'Main Navigation',
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          roles: ['student', 'admin', 'warden'],
        },
        {
          name: 'All Issues',
          href: '/issues',
          icon: AlertCircle,
          roles: ['student', 'admin', 'warden'],
        },
        {
          name: 'My Complaints',
          href: '/my-issues',
          icon: ListTodo,
          roles: ['student', 'admin', 'warden'],
        },
        {
          name: 'Report Issue',
          href: '/report-issue',
          icon: PlusCircle,
          roles: ['student', 'admin', 'warden'],
        },
        {
          name: 'Announcements',
          href: '/announcements',
          icon: Megaphone,
          roles: ['student', 'admin', 'warden'],
        },
        {
          name: 'Hostel Diaries',
          href: '/diaries',
          icon: Camera,
          roles: ['student', 'admin', 'warden'],
        },
        {
          name: 'Hostel Rooms Map',
          href: '/hostel-rooms',
          icon: Grid,
          roles: ['admin', 'warden'],
        },
        {
          name: 'Analytics',
          href: '/analytics',
          icon: BarChart3,
          roles: ['student', 'admin', 'warden'],
        },
        {
          name: 'AI Assistant',
          href: '/chatbot',
          icon: Bot,
          roles: ['student', 'admin', 'warden'],
        },
      ],
    },
    {
      title: 'Hostel & Support',
      items: [
        {
          name: 'Hostel Facilities',
          href: '/facilities',
          icon: Building,
          roles: ['student', 'admin', 'warden'],
        },
        {
          name: 'Wardens Directory',
          href: '/wardens',
          icon: User,
          roles: ['student', 'admin', 'warden'],
        },
        {
          name: 'Mess & Schedules',
          href: '/schedules',
          icon: Calendar,
          roles: ['student', 'admin', 'warden'],
        },
        {
          name: 'Anti-Ragging Cell',
          href: '/anti-ragging',
          icon: ShieldAlert,
          roles: ['student', 'admin', 'warden'],
        },
        {
          name: 'Feedback',
          href: '/feedback',
          icon: MessageSquare,
          roles: ['student', 'admin', 'warden'],
        },
        {
          name: 'About CITK',
          href: '/about',
          icon: Info,
          roles: ['student', 'admin', 'warden'],
        },
      ],
    },
  ]

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {navItems.map((group, idx) => (
          <div key={idx}>
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {group.title}
            </p>
            <div className="mt-2 space-y-1">
              {group.items
                .filter((item) => item.roles.includes(role))
                .map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500')} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
