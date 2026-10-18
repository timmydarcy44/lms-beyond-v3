import type { ReactNode } from "react";
import { JadeInternalFill } from "@/components/demo/jade-internal-fill";
import { requireClubDashboardAccess } from "@/lib/auth/require-club-partenaire";

export default async function ClubDashboardLayout({ children }: { children: ReactNode }) {
  await requireClubDashboardAccess();
  return <JadeInternalFill>{children}</JadeInternalFill>;
}
