import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/header'
import Footer from '@/components/footer'
import BackToTop from '@/components/back-to-top'
import { createClient } from '@/lib/supabase/server'
import { HostelName, UserRole } from '@/types/database.types'

export const metadata: Metadata = {
  title: 'CITK HOSTEL MANAGEMENT SYSTEM',
  description: 'Central Institute of Technology Kokrajhar Hostel Issue Management System',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  let notificationCount = 0

  if (user) {
    try {
      const [{ data: userProfile }, { count }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false),
      ])

      // If profile exists use it, otherwise synthesize from auth metadata so header knows user is logged in
      profile = userProfile || {
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: ((user.user_metadata?.role as UserRole) || 'student') as UserRole,
        hostel: ((user.user_metadata?.hostel as HostelName) || 'SJ') as HostelName,
        room_no: user.user_metadata?.room_no || 'N/A',
        profile_pic_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      notificationCount = count || 0
    } catch (err) {
      console.error('Error loading layout profile:', err)
      // Fallback object so user can see their logout button
      profile = {
        id: user.id,
        username: user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: 'student' as UserRole,
        hostel: 'SJ' as HostelName,
        room_no: 'N/A',
        profile_pic_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  }

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body>
        <Header userProfile={profile} notificationCount={notificationCount} />
        <main>{children}</main>
        <BackToTop />
        <Footer />
      </body>
    </html>
  )
}
