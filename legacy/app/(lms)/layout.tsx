import type { ReactNode } from "react";
import { Sidebar } from "@/components/shell/sidebar";

export default function LmsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-[#0b0f14] text-white">
      <Sidebar />
      <main className="flex-1 min-h-dvh overflow-y-auto">{children}</main>
    </div>
  );
}
