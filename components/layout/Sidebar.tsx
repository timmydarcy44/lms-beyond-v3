'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, LayoutDashboard, BookOpen, Layers, Folder, FileCheck, Users, Settings } from 'lucide-react';

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

export default function Sidebar({ 
  role, 
  collapsed, 
  onToggle,
  currentOrg
}: { 
  role: 'admin' | 'instructor' | 'tutor' | 'learner';
  collapsed: boolean;
  onToggle: () => void;
  currentOrg?: string;
}) {
  // URLs dynamiques basées sur l'organisation actuelle
  const getOrgUrl = (path: string) => {
    // Ne pas transformer les URLs qui n'ont pas de page correspondante avec organisation
    const pathsWithoutOrgPages = [
      '/admin/formations/new',
      '/admin/parcours/new',
      '/admin/ressources',
      '/admin/tests',
      '/admin/utilisateurs',
      '/admin/settings'
    ];
    
    if (pathsWithoutOrgPages.includes(path)) {
      return path; // Garder l'URL originale
    }
    
    if (currentOrg && path !== '/admin') {
      return `/admin/${currentOrg}${path.replace('/admin', '')}`;
    }
    return path;
  };

  return (
    <div className="py-4">
      {/* Header avec bouton toggle */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
          <div className={`text-lg font-semibold text-iris-grad transition-all duration-300 ${
            collapsed ? 'text-center w-full' : ''
          }`}>
            {collapsed ? 'LMS' : 'LMS Admin'}
          </div>
          {!collapsed && (
            <button
              onClick={onToggle}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              title="Réduire la sidebar"
            >
              <ChevronLeft size={16} className="text-neutral-400" />
            </button>
          )}
        </div>
        {!collapsed && <div className="text-xs opacity-70">Espace {role}</div>}
        {!collapsed && currentOrg && (
          <div className="text-xs opacity-50 mt-1">Org: {currentOrg}</div>
        )}
      </div>

      {/* Bouton toggle pour mode collapsed */}
      {collapsed && (
        <div className="px-4 pb-4">
          <button
            onClick={onToggle}
            className="w-full p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center"
            title="Développer la sidebar"
          >
            <ChevronRight size={16} className="text-neutral-400" />
          </button>
        </div>
      )}

      <nav className="space-y-1">
        <NavItem href={getOrgUrl('/admin')} icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
        <NavItem href={getOrgUrl('/admin/formations')} icon={BookOpen} label="Formations" collapsed={collapsed} />
        <NavItem href={getOrgUrl('/admin/ressources')} icon={Folder} label="Ressources" collapsed={collapsed} />
        <NavItem href={getOrgUrl('/admin/tests')} icon={FileCheck} label="Tests" collapsed={collapsed} />
        <NavItem href={getOrgUrl('/admin/parcours')} icon={Layers} label="Parcours" collapsed={collapsed} />
        <NavItem href={getOrgUrl('/admin/utilisateurs')} icon={Users} label="Utilisateurs" collapsed={collapsed} />
        <NavItem href={getOrgUrl('/admin/settings')} icon={Settings} label="Paramètres" collapsed={collapsed} />
      </nav>
    </div>
  );
}