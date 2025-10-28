'use client'

import { Home, Layers, Users2, FolderOpen, FlaskConical, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import clsx from 'clsx'

const items = [
  { href: '/dashboard', label: 'Accueil', icon: Home },
  { href: '/courses',   label: 'Formations', icon: Layers },
  { href: '/groups',    label: 'Groupes', icon: Users2 },
  { href: '/paths',     label: 'Parcours', icon: Layers },
  { href: '/resources', label: 'Ressources', icon: FolderOpen },
  { href: '/tests',     label: 'Tests', icon: FlaskConical },
  { href: '/settings',  label: 'Paramètres', icon: Settings },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen z-40 border-r border-white/5 bg-[#0b0d10]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0b0d10]/80',
        collapsed ? 'w-16' : 'w-64',
        'transition-[width] duration-300 ease-out'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4">
        <span className={clsx('text-white/90 font-semibold tracking-wide', collapsed && 'opacity-0 pointer-events-none')}>
          LMS
        </span>
        <button
          onClick={() => setCollapsed(v => !v)}
          className="rounded-lg p-2 hover:bg-white/5 text-white/70"
          aria-label="Toggle sidebar"
        >
          <div className="h-[2px] w-5 bg-white/70 mb-[3px]" />
          <div className="h-[2px] w-5 bg-white/70" />
        </button>
      </div>

      <nav className="mt-2 space-y-1 px-2">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 hover:text-white',
              'hover:bg-white/5 transition-colors'
            )}
          >
            <Icon className="size-5 shrink-0 text-white/70 group-hover:text-white" />
            <span className={clsx('truncate', collapsed && 'opacity-0 pointer-events-none')}>{label}</span>
          </Link>
        ))}
      </nav>

      <form action="/api/auth/signout" method="post" className="absolute bottom-4 left-0 right-0 px-2">
        <button
          className={clsx(
            'w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm',
            'text-white/70 hover:text-white hover:bg-white/5 transition-colors'
          )}
        >
          <LogOut className="size-5" />
          <span className={clsx(collapsed && 'opacity-0 pointer-events-none')}>Se déconnecter</span>
        </button>
      </form>
    </aside>
  )
}
