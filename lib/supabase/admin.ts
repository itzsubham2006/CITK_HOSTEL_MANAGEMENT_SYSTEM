import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// IMPORTANT: This client uses the service role key and MUST ONLY be used on the server
// in Server Components, Server Actions, or Route Handlers (never exported to client code).
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  // Fallback for build time if service role key is not yet configured in local environment
  const key = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-service-key'

  return createClient<Database>(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
