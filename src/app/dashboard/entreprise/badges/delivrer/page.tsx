"use client";

import { useEffect, useState } from "react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { useEntrepriseOverview } from "@/hooks/use-entreprise-overview";

export default function EntrepriseBadgesPage() {
  const { data, loading, fetchError, reload } = useEntrepriseOverview();
  const [badgeTotal, setBadgeTotal] = useState<number | null>(null);

  useEffect(() => {
    const fromKpi = data?.kpis?.badges_awarded;
    if (typeof fromKpi === "number") {
      setBadgeTotal(fromKpi);
      return;
    }
    const employees = data?.employees ?? [];
    if (employees.some((row) => typeof row.badge_count === "number")) {
      setBadgeTotal(employees.reduce((sum, row) => sum + (row.badge_count ?? 0), 0));
    }
  }, [data]);

  return (
    <div className="min-h-screen bg-[#F4F4F1] text-[#07080B]">
      <EnterpriseSidebar />
      <main className="min-h-screen px-4 py-8 pb-32 sm:px-6 lg:px-10 lg:pl-[264px]">
        <h1 className="text-[40px] font-extrabold tracking-[-1.2px]">Badges</h1>
        <p className="mt-2 max-w-xl text-[15px] text-[#3A3D45]">
          Open Badges déjà délivrés aux collaborateurs. Le circuit d&apos;obtention reste celui des évaluations existantes.
        </p>
        {loading ? (
          <div className="mt-8 h-32 animate-pulse rounded-[26px] bg-white" />
        ) : fetchError ? (
          <div className="mt-8 rounded-[26px] bg-white p-6">
            <p className="text-[15px]">{fetchError}</p>
            <button type="button" onClick={() => void reload()} className="mt-4 h-11 rounded-full bg-[#07080B] px-5 text-sm font-semibold text-white">
              Réessayer
            </button>
          </div>
        ) : (
          <section className="mt-8 max-w-md rounded-[26px] bg-[#6E5BFF] p-6 text-white">
            <p className="text-[40px] font-extrabold leading-none">{badgeTotal ?? "—"}</p>
            <p className="mt-2 text-[15px] text-white/85">Open Badges obtenus</p>
          </section>
        )}
      </main>
    </div>
  );
}
