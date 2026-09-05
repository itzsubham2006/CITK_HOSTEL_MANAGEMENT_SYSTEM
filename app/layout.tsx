import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/header'
import Footer from '@/components/footer'
import BackToTop from '@/components/back-to-top'
import { createClient } from '@/lib/supabase/server'

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
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    profile = userProfile

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    notificationCount = count || 0
  }

  return (
    <html lang="en">
      <head>
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
