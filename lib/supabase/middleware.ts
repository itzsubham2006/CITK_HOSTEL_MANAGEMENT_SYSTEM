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

  // Auth pages where logged-in users should be redirected to their dashboard
  const isAuthPage =
    path === '/login' || path === '/signup' || path === '/register'

  // Routes that need role-based access control
  const isAdminRoute = path === '/admin' || path.startsWith('/admin/')
  const isWardenRoute = path === '/warden' || path.startsWith('/warden/')
  const isHostelManagementRoute =
    path === '/hostel-rooms' ||
    path.startsWith('/hostel-rooms/') ||
    path === '/hostel-selector' ||
    path.startsWith('/hostel-selector/')

  // Does this route actually need a getUser() network call?
  const needsAuthVerification = isGatedRoute || isAuthPage

  // Performance optimization: Check if client has any Supabase auth cookies
  const allCookies = request.cookies.getAll()
  const hasAuthCookie = allCookies.some((c) => c.name.startsWith('sb-'))

  // 1. If no auth cookie at all:
  // - For gated routes: redirect to login immediately in ~0ms (no remote network call)
  // - For public routes (including auth pages): pass through immediately in ~0ms
  if (!hasAuthCookie) {
    if (isGatedRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.search = `?redirect=${encodeURIComponent(path + search)}`
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // 2. Has auth cookie but visiting a public, non-auth route (e.g. /, /about, /facilities)
  // Skip getUser() entirely — no network call needed (~0ms)
  if (!needsAuthVerification) {
    return supabaseResponse
  }

  // 3. Route needs auth verification — call getUser() once (single network round-trip)
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

  // If no valid user and on an auth page, just let them through to the login/signup form
  if (!user) {
    return supabaseResponse
  }

  // --- User is authenticated from here ---

  // Cached role lookup — called at most once per request, reused for all checks
  let cachedRole: string | null = null
  const getUserRole = async (): Promise<string> => {
    if (cachedRole !== null) return cachedRole
    // Fast path: check user_metadata first (no DB query)
    if (user?.user_metadata?.role) {
      cachedRole = user.user_metadata.role as string
      return cachedRole
    }
    // Fallback: query the profiles table (single DB query)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user!.id)
      .maybeSingle()
    cachedRole = profile?.role || 'student'
    return cachedRole
  }

  // 4. If logged in and accessing login or signup: redirect to role-based dashboard or return-to URL
  if (isAuthPage) {
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

  // 5. Server-side role check for admin routes (matches /admin and /admin/*, NOT other prefixes)
  if (isAdminRoute) {
    const role = await getUserRole()

    if (role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // 6. Server-side role check for warden management routes (matches /warden and /warden/*, NOT /wardens)
  if (isWardenRoute) {
    const role = await getUserRole()

    if (role !== 'warden' && role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // 7. Server-side role check for hostel-rooms and hostel-selector (warden and admin only)
  if (isHostelManagementRoute) {
    const role = await getUserRole()

    if (role !== 'admin' && role !== 'warden') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
