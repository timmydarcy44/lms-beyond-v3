"use client";

import { useState, useEffect } from "react";
import { SuperAdminSidebarClean } from "./super-admin-sidebar-clean";

export function SuperAdminSidebarWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <>
      <SuperAdminSidebarClean onToggle={() => setSidebarOpen(!sidebarOpen)} open={sidebarOpen} />
      <main
        className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300 ${
          sidebarOpen ? "ml-[260px]" : "ml-[80px]"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </>
  );
}



