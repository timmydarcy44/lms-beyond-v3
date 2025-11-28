"use client";

import { usePathname } from "next/navigation";
import { AdminSidebarWrapper } from "./AdminSidebarWrapper";

type AdminLayoutWrapperProps = {
  children: React.ReactNode;
  organizationLogo?: string | null;
};

export function AdminLayoutWrapper({ children, organizationLogo }: AdminLayoutWrapperProps) {
  const pathname = usePathname();
  const isBeyondCarePage = pathname?.includes("beyond-care");
  const isBeyondConnectPage = pathname?.includes("beyond-connect");

  // Si c'est une page Beyond Care ou Beyond Connect, laisser DashboardShell gérer tout (pas de sidebar admin)
  if (isBeyondCarePage || isBeyondConnectPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden relative" style={{ backgroundColor: 'transparent' }}>
      {/* Fond avec gradient bleu et formes abstraites - appliqué partout */}
      <div className="fixed inset-0 -z-10" style={{
        background: 'linear-gradient(135deg, #1a1b2e 0%, #16213e 30%, #0f172a 60%, #0a0f1a 100%)',
      }} />
      {/* Formes abstraites - cercles dégradés avec blur */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-3xl -z-10" style={{
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
      }} />
      <div className="fixed top-1/3 left-0 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl -z-10" style={{
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
      }} />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-12 blur-2xl -z-10" style={{
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
      }} />
      <div className="fixed bottom-1/3 left-1/4 w-[350px] h-[350px] rounded-full opacity-10 blur-2xl -z-10" style={{
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
      }} />
      {/* Formes géométriques subtiles */}
      <div className="fixed top-0 left-0 w-64 h-64 opacity-5 -z-10" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%)',
        clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
      }} />
      <div className="fixed bottom-0 right-0 w-80 h-80 opacity-4 -z-10" style={{
        background: 'linear-gradient(45deg, transparent 0%, rgba(139, 92, 246, 0.08) 100%)',
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
      }} />
      
      <AdminSidebarWrapper organizationLogo={organizationLogo} />
      <main className="flex-1 transition-[margin-left] duration-300 ease-in-out relative z-10 overflow-x-hidden w-full" style={{ marginLeft: 'var(--sidebar-width, 272px)' }}>
        <div className="w-full max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

