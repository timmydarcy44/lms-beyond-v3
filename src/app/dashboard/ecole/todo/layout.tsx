"use client";

import { Suspense } from "react";
import { EcoleSidebar } from "@/components/ecole/ecole-sidebar";

type TodoLayoutProps = {
  children: React.ReactNode;
};

export default function TodoLayout({ children }: TodoLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-[#121212] text-white">
      <div className="flex min-h-screen">
        <EcoleSidebar showCollapseControl={false} className="hidden md:flex" />
        <main className="min-h-screen flex-1 md:ml-64">
          <Suspense fallback={null}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
