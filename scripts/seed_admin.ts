import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Helper to load .env.local if not loaded by runner
function loadEnv() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return
  }

  const envPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim()
          const val = trimmed.slice(eqIdx + 1).trim()
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    })
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function seedAdmin() {
  const adminEmail = 'lastw5232@gmail.com'
  console.log(`Seeding initial admin allowlist with email: ${adminEmail}...`)

  const { data, error } = await supabase
    .from('admin_emails')
    .upsert({ email: adminEmail }, { onConflict: 'email' })
    .select()

  if (error) {
    console.error('Failed to seed admin email:', error.message)
    console.log('\nTip: Make sure you have run the migration in Supabase SQL Editor:')
    console.log('supabase/migrations/20260905000001_add_otp_and_roles.sql')
    process.exit(1)
  }

  console.log('✅ Initial admin successfully seeded into admin_emails:')
  console.log(data)
  console.log('\nYou can verify this in Supabase SQL editor by running:')
  console.log("SELECT * FROM public.admin_emails WHERE email = 'lastw5232@gmail.com';")
}

seedAdmin()
