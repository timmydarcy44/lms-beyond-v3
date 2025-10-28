import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const next = url.searchParams.get('next') || '/dashboard'

  const res = NextResponse.redirect(new URL(next, req.url))

  // Optionnel : ping pour rafraîchir cookies en réponse
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          const cookies: { name: string; value: string }[] = []
          const cookieHeader = req.headers.get('cookie')
          if (cookieHeader) {
            cookieHeader.split(';').forEach((cookie) => {
              const [name, value] = cookie.trim().split('=')
              if (name && value) cookies.push({ name, value })
            })
          }
          return cookies
        },
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )
  await supabase.auth.getUser() // synchronise si nécessaire

  return res
}