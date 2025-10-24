'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { ReactNode } from 'react';

function NavItem({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`block rounded-xl px-3 py-2 text-sm transition-all duration-200 ease-cine
        ${active 
          ? 'bg-primary/20 text-primary border border-primary/30' 
          : 'text-muted hover:bg-surfaceAlt hover:text-text border border-transparent'
        }`}
    >
      {children}
    </Link>
  );
}

export default function AdminShell({
  orgSlug,
  title,
  children,
}: {
  orgSlug: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="grid min-h-dvh grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="hidden border-r border-border bg-surface p-4 md:block">
          <div className="mb-6">
            <Link href={`/admin/${orgSlug}/dashboard`} className="text-lg font-semibold text-text">
              LMS Admin
            </Link>
            <p className="text-xs text-muted">Organisation : {orgSlug}</p>
          </div>
          <nav className="space-y-2">
            <NavItem href={`/admin/${orgSlug}/dashboard`}>Dashboard</NavItem>
            <NavItem href={`/admin/${orgSlug}/formations`}>Formations</NavItem>
            <NavItem href={`/admin/${orgSlug}/ressources`}>Ressources</NavItem>
            <NavItem href={`/admin/${orgSlug}/tests`}>Tests</NavItem>
            <NavItem href={`/admin/${orgSlug}/parcours`}>Parcours</NavItem>
          </nav>
        </aside>

        {/* Main */}
        <div className="flex min-h-dvh flex-col">
          <header className="flex items-center gap-3 border-b border-border bg-surfaceAlt px-4 py-3">
            <button className="md:hidden rounded-lg p-2 hover:bg-surface transition-colors" aria-label="Menu">
              <Menu size={18} />
            </button>
            <h1 className="text-base font-semibold text-text">{title ?? 'Administration'}</h1>
          </header>
          <main className="flex-1 bg-bg px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}