"use client";

import { useState } from "react";
import { SuperAdminSidebarApple } from "./super-admin-sidebar-apple";

export function SuperAdminSidebarWrapperApple({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <>
      <SuperAdminSidebarApple onToggle={() => setSidebarOpen(!sidebarOpen)} open={sidebarOpen} />
      <main
        className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${
          sidebarOpen ? "ml-[280px]" : "ml-[80px]"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </>
  );
}





