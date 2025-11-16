"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Menu } from "lucide-react";

type AdminPageScaffoldProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AdminPageScaffold({ title, subtitle, children }: AdminPageScaffoldProps) {
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 1024 : false));
  const [open, setOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 1024 : false));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setOpen(true);
      }
    };
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const sidebarWidth = useMemo(() => {
    if (isDesktop) {
      return open ? 272 : 88;
    }
    return open ? 272 : 0;
  }, [isDesktop, open]);

  return (
    <div className="relative flex min-h-screen overflow-hidden text-white" style={{ backgroundColor: 'transparent' }}>
      <AdminSidebar open={open} onToggle={() => setOpen((prev) => !prev)} />
      {open && !isDesktop ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Fermer le menu"
        />
      ) : null}
      <div className="flex-1 transition-[margin-left] duration-300" style={{ marginLeft: sidebarWidth }}>
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-transparent px-5 py-5 backdrop-blur-sm lg:px-8" style={{ border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">{title}</h1>
              {subtitle ? <p className="text-xs text-white/60">{subtitle}</p> : null}
            </div>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-2xl font-semibold">{title}</h1>
            {subtitle ? <p className="text-sm text-white/60">{subtitle}</p> : null}
          </div>
          <div className="text-xs uppercase tracking-[0.3em] text-white/40">Admin Beyond</div>
        </header>
        <main className="space-y-10 px-5 py-10 lg:px-8 w-full max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}




