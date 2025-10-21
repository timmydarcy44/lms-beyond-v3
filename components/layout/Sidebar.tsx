'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, Layers, Folder, FileCheck, Users, Settings } from 'lucide-react';

function NavItem({ href, icon: Icon, label, collapsed }: { href: string; icon: any; label: string; collapsed: boolean }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={[
        'mx-3 mt-1 flex items-center gap-3 rounded-xl px-3 py-2 transition relative group',
        active
          ? 'bg-white/10 border border-white/10 shadow-elev-2'
          : 'hover:bg-white/5'
      ].join(' ')}
      title={collapsed ? label : undefined}
    >
      <Icon size={18} className={active ? 'text-white' : 'text-neutral-300'} />
      {!collapsed && <span className="text-sm">{label}</span>}
      
      {/* Tooltip pour mode collapsed */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </Link>
  );
}

export default function Sidebar({ role }: { role: 'admin' | 'instructor' | 'tutor' | 'learner' }) {
  const [collapsed, setCollapsed] = useState(false);

  // Charger l'état depuis localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('lms.sidebar');
    if (savedState) {
      setCollapsed(savedState === 'collapsed');
    }
  }, []);

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    localStorage.setItem('lms.sidebar', collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  return (
    <div className={`py-4 transition-[width] duration-300 ease-out ${
      collapsed ? 'w-16' : 'w-72'
    }`}>
      <div className="px-4 pb-4">
        <div className={`text-lg font-semibold text-iris-grad transition-all duration-300 ${
          collapsed ? 'text-center' : ''
        }`}>
          {collapsed ? 'LMS' : 'LMS Admin'}
        </div>
        {!collapsed && <div className="text-xs opacity-70">Espace {role}</div>}
      </div>

      <nav className="space-y-1">
        <NavItem href="/admin" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
        <NavItem href="/admin/formations" icon={BookOpen} label="Formations" collapsed={collapsed} />
        <NavItem href="/admin/ressources" icon={Folder} label="Ressources" collapsed={collapsed} />
        <NavItem href="/admin/tests" icon={FileCheck} label="Tests" collapsed={collapsed} />
        <NavItem href="/admin/parcours" icon={Layers} label="Parcours" collapsed={collapsed} />
        <NavItem href="/admin/utilisateurs" icon={Users} label="Utilisateurs" collapsed={collapsed} />
        <NavItem href="/admin/settings" icon={Settings} label="Paramètres" collapsed={collapsed} />
      </nav>
    </div>
  );
}