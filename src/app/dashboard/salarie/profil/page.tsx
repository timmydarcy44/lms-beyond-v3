"use client";

import dynamic from "next/dynamic";
import { SALARIE_PAGE_SHELL } from "@/lib/salarie/connect-nav";

const ApprenantDashboardClient = dynamic(
  () =>
    import("@/components/apprenant/apprenant-dashboard-client").then((m) => ({
      default: m.ApprenantDashboardClient,
    })),
  {
    loading: () => (
      <div className="animate-pulse space-y-4 py-6">
        <div className="h-8 w-48 rounded bg-white/10" />
        <div className="h-40 rounded-2xl bg-white/[0.04]" />
      </div>
    ),
    ssr: false,
  },
);

export default function SalarieProfilPage() {
  return (
    <div className={SALARIE_PAGE_SHELL}>
      <ApprenantDashboardClient initialView="profil" homeHref="/dashboard/salarie" />
    </div>
  );
}
