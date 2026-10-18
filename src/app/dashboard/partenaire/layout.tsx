import type { ReactNode } from "react";
import { JadeInternalFill } from "@/components/demo/jade-internal-fill";
import { requirePartenaireDashboardAccess } from "@/lib/auth/require-club-partenaire";

export default async function PartenaireDashboardLayout({ children }: { children: ReactNode }) {
  await requirePartenaireDashboardAccess();
  return <JadeInternalFill>{children}</JadeInternalFill>;
}
