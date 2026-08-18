import type { ReactNode } from "react";
import { requireClubDashboardAccess } from "@/lib/auth/require-club-partenaire";

export default async function ClubDashboardLayout({ children }: { children: ReactNode }) {
  await requireClubDashboardAccess();
  return <>{children}</>;
}
