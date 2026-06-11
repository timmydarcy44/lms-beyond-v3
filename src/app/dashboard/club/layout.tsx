import type { ReactNode } from "react";

/** Auth club : middleware (club-only lock + login sur les autres dashboards). */
export default function ClubDashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
