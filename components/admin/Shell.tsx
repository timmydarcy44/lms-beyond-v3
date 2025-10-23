'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Menu } from 'lucide-react';

function NavItem({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm transition
        ${active ? 'bg-white/10 text-white' : 'text-neutral-300 hover:bg-white/5 hover:text-white'}`}
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
    <div className="grid min-h-dvh grid-cols-[260px_1fr]">
      {/* SIDEBAR */}
      <aside className="hidden border-r border-white/10 bg-black/30 p-4 md:block">
        <div className="mb-6">
          <Link href={`/admin/${orgSlug}/dashboard`} className="text-lg font-semibold">
            LMS Admin
          </Link>
          <p className="text-xs text-neutral-400">Organisation : {orgSlug}</p>
        </div>

        <nav className="space-y-1">
          <NavItem href={`/admin/${orgSlug}/dashboard`}>Dashboard</NavItem>
          <NavItem href={`/admin/${orgSlug}/formations`}>Formations</NavItem>
          <NavItem href={`/admin/${orgSlug}/ressources`}>Ressources</NavItem>
          <NavItem href={`/admin/${orgSlug}/tests`}>Tests</NavItem>
          <NavItem href={`/admin/${orgSlug}/parcours`}>Parcours</NavItem>
          {/* ajoute autres entrées si besoin */}
        </nav>
      </aside>

      {/* MAIN */}
      <div className="flex min-h-dvh flex-col">
        {/* TOPBAR */}
        <header className="flex items-center gap-3 border-b border-white/10 bg-black/20 px-4 py-3">
          <button className="md:hidden rounded-lg p-2 hover:bg-white/10" aria-label="Menu">
            <Menu size={18} />
          </button>
          <h1 className="text-base font-semibold">{title ?? 'Administration'}</h1>
        </header>

        <main className="px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
