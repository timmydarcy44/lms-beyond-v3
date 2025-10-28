import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: Request) {
  const res = NextResponse.json({ ok: true })
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
  await supabase.auth.signOut()
  return res
}
