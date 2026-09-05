import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co').replace(/\/$/, '')
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const path = request.nextUrl.pathname
  const search = request.nextUrl.search

  // List of protected routes that MUST be gated behind login/signup (Feature 1)
  const isGatedRoute =
    path === '/issues' ||
    path.startsWith('/issues/') ||
    path === '/analytics' ||
    path.startsWith('/analytics/') ||
    path === '/chatbot' ||
    path.startsWith('/chatbot/') ||
    path === '/notifications' ||
    path.startsWith('/notifications/') ||
    path === '/report-issue' ||
    path.startsWith('/report-issue/') ||
    path === '/my-issues' ||
    path.startsWith('/my-issues/') ||
    path === '/profile' ||
    path.startsWith('/profile/') ||
    path === '/diaries' ||
    path.startsWith('/diaries/') ||
    path === '/hostel-rooms' ||
    path.startsWith('/hostel-rooms/') ||
    path === '/hostel-selector' ||
    path.startsWith('/hostel-selector/') ||
    path === '/student' ||
    path.startsWith('/student/') ||
    path === '/admin' ||
    path.startsWith('/admin/') ||
    path === '/warden' ||
    path.startsWith('/warden/')

  // Performance optimization: Check if client has any Supabase auth cookies
  const allCookies = request.cookies.getAll()
  const hasAuthCookie = allCookies.some((c) => c.name.startsWith('sb-'))

  // 1. If no auth cookie at all:
  // - For gated routes: redirect to login immediately in ~0ms (no remote network call)
  // - For public routes: pass through immediately in ~0ms (no remote network call)
  if (!hasAuthCookie) {
    if (isGatedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = `?redirect=${encodeURIComponent(path + search)}`
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user || null
  } catch (err) {
    console.error('Error in middleware auth check:', err)
    user = null
  }

  // If auth cookie was stale or invalid and accessing a gated route
  if (!user && isGatedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?redirect=${encodeURIComponent(path + search)}`
    return NextResponse.redirect(url)
  }

  // Fast helper to get role from user_metadata before falling back to remote DB query
  const getUserRole = async (): Promise<string> => {
    if (user?.user_metadata?.role) {
      return user.user_metadata.role as string
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .maybeSingle()
    return profile?.role || 'student'
  }

  // 2. If logged in and accessing login or signup: redirect to role-based dashboard or return-to URL
  if (user && (path === '/login' || path === '/signup' || path === '/register')) {
    const role = await getUserRole()
    const redirectUrl = request.nextUrl.clone()

    const destination = request.nextUrl.searchParams.get('redirect')
    if (destination && !destination.startsWith('/login') && !destination.startsWith('/signup') && !destination.startsWith('/register')) {
      redirectUrl.pathname = destination
      redirectUrl.search = ''
    } else {
      if (role === 'admin') {
        redirectUrl.pathname = '/admin/dashboard'
      } else if (role === 'warden') {
        redirectUrl.pathname = '/warden/dashboard'
      } else {
        redirectUrl.pathname = '/student/dashboard'
      }
      redirectUrl.search = ''
    }
    return NextResponse.redirect(redirectUrl)
  }

  // 3. Server-side role check for admin routes (matches /admin and /admin/*, NOT other prefixes)
  if (user && (path === '/admin' || path.startsWith('/admin/'))) {
    const role = await getUserRole()

    if (role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // 4. Server-side role check for warden management routes (matches /warden and /warden/*, NOT /wardens)
  if (user && (path === '/warden' || path.startsWith('/warden/'))) {
    const role = await getUserRole()

    if (role !== 'warden' && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // 5. Server-side role check for hostel-rooms and hostel-selector (warden and admin only)
  if (
    user &&
    (path === '/hostel-rooms' ||
      path.startsWith('/hostel-rooms/') ||
      path === '/hostel-selector' ||
      path.startsWith('/hostel-selector/'))
  ) {
    const role = await getUserRole()

    if (role !== 'admin' && role !== 'warden') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
