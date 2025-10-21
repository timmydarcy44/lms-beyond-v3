'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({
  children,
  role,
  currentOrg,
}: {
  children: React.ReactNode;
  role: 'admin' | 'instructor' | 'tutor' | 'learner';
  currentOrg?: string;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Charger l'état depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setSidebarCollapsed(JSON.parse(saved));
    }
  }, []);

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-[#252525] text-neutral-100">
      {/* grid 2 colonnes : sidebar dynamique + contenu */}
      <div className={`grid min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? 'grid-cols-[60px_1fr]' : 'grid-cols-[260px_1fr]'
      }`}>
        {/* Sidebar sticky, pas d'espace inutile en haut */}
        <aside className="sticky top-0 h-svh overflow-y-auto border-r border-white/10 bg-white/5 backdrop-blur-md">
          <Sidebar role={role} collapsed={sidebarCollapsed} onToggle={toggleSidebar} currentOrg={currentOrg} />
        </aside>

        {/* Colonne contenu : topbar compacte + page content */}
        <div className="min-h-svh flex flex-col">
          <Topbar />
          {/* Contenu : commence tout en haut, padding contrôlé ici */}
          <main className="flex-1 px-6 py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}