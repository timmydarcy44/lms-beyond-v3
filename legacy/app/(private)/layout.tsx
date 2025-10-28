import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import Sidebar from '@/components/Sidebar'
import '../globals.css'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => cookieStore.get(key)?.value,
      }
    }
  )
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/dashboard')
  }

  return (
    <div className="bg-[#0b0d10] text-white min-h-screen">
      <Sidebar />
      <main className="pl-64"> {/* match width Sidebar expanded; le composant gère le collapse en CSS */}
        {children}
      </main>
    </div>
  )
}
