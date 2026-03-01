import type { ReactNode } from "react";
import { ParticuliersSidebar } from "@/components/navigation/particuliers-sidebar";

export default function ParticuliersLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white text-black">
      <ParticuliersSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
