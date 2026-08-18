import type { ReactNode } from "react";
import { requirePartenaireDashboardAccess } from "@/lib/auth/require-club-partenaire";

export default async function PartenaireDashboardLayout({ children }: { children: ReactNode }) {
  await requirePartenaireDashboardAccess();
  return <>{children}</>;
}
