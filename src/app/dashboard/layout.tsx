import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/query-provider";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Provides React Query for dashboard surfaces (Sidebar uses useUserRole → useQuery).
  // RootLayout already provides SupabaseProvider.
  return <QueryProvider>{children}</QueryProvider>;
}
