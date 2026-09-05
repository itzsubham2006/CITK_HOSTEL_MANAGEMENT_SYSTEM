import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const redirectUrl = new URL('/login', req.url)
  return NextResponse.redirect(redirectUrl)
}

export async function GET(req: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const redirectUrl = new URL('/login', req.url)
  return NextResponse.redirect(redirectUrl)
}
