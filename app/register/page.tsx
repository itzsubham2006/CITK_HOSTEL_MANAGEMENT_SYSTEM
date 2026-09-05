import { redirect } from 'next/navigation'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const redirectParam = typeof params.redirect === 'string' ? params.redirect : ''

  if (redirectParam) {
    redirect(`/signup?redirect=${encodeURIComponent(redirectParam)}`)
  }

  redirect('/signup')
}
