"use client";

import Link from "next/link";
import { Manrope } from "next/font/google";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { useEntrepriseOverview } from "@/hooks/use-entreprise-overview";
import { cn } from "@/lib/utils";

const manrope = Manrope({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });

const CRITERION = { declared: "Déclarée", proof: "Preuve déposée", badge: "Badge obtenu" } as const;

function initials(first: string | null, last: string | null) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

export default function EntrepriseBadgesPage() {
  const { data, loading, fetchError, reload } = useEntrepriseOverview();
  const employees = data?.employees ?? [];
  const awarded = typeof data?.kpis?.badges_awarded === "number"
    ? data.kpis.badges_awarded
    : employees.reduce((sum, row) => sum + (row.badge_count ?? 0), 0);
  const thisMonth = typeof data?.kpis?.badges_this_month === "number" ? data.kpis.badges_this_month : null;
  const rows = employees.flatMap((employee) =>
    (employee.skills ?? [])
      .filter((skill) => skill.status === "badge" || skill.status === "proof")
      .map((skill) => ({
        id: `${employee.id}-${skill.name}`,
        employeeId: employee.id,
        name: [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "Collaborateur",
        initials: initials(employee.first_name, employee.last_name),
        badge: skill.name,
        criterion: CRITERION[skill.status],
        delivered: skill.status === "badge",
      })),
  );
  const pending = rows.filter((row) => !row.delivered).length;

  return (
    <div className={cn("min-h-screen bg-[#F4F4F1] text-[#07080B]", manrope.className)}>
      <EnterpriseSidebar />
      <main className="px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pl-[104px]">
        <h1 className="text-[40px] font-extrabold leading-none tracking-[-1.2px]">Badges</h1>
        <p className="mt-2 max-w-xl text-[15px] text-[#3A3D45]">
          Open Badges de votre organisation : délivrés, obtenus ce mois-ci, et preuves encore en attente.
        </p>

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="h-36 animate-pulse rounded-[26px] bg-white" />
            <div className="h-36 animate-pulse rounded-[26px] bg-[#ECE9E1]" />
            <div className="h-36 animate-pulse rounded-[26px] bg-white" />
          </div>
        ) : fetchError ? (
          <div className="mt-6 rounded-[26px] bg-white p-6">
            <p className="text-[15px]">{fetchError}</p>
            <button type="button" onClick={() => void reload()} className="mt-4 h-11 rounded-full bg-[#07080B] px-5 text-sm font-semibold text-white">Réessayer</button>
          </div>
        ) : (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stat label="Délivrés" value={String(awarded)} hint="au total" />
              <Stat label="Ce mois" value={thisMonth == null ? "—" : String(thisMonth)} hint="nouveaux badges" violet />
              <Stat label="En attente" value={String(pending)} hint="preuves à valider" />
            </section>
            <section className="mt-4 rounded-[26px] bg-white p-3 sm:p-4">
              <div className="flex items-center justify-between px-2 py-2">
                <h2 className="text-[16px] font-extrabold">Suivi</h2>
                <span className="text-[13px] text-[#6B6F7A]">{rows.length}</span>
              </div>
              {rows.length === 0 ? (
                <p className="px-2 py-10 text-center text-[14px] text-[#6B6F7A]">Aucun badge délivré pour l&apos;instant.</p>
              ) : (
                <ul>
                  {rows.map((row) => (
                    <li key={row.id} className="border-t border-[#F1EFE9] first:border-t-0">
                      <Link href={`/dashboard/entreprise/salaries/${row.employeeId}`} className="flex min-h-16 items-center gap-3 rounded-[18px] px-2 py-2 hover:bg-[#F7F5FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6E5BFF]">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6E5BFF] text-[13px] font-bold text-white">{row.initials}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-extrabold">{row.badge}</span>
                          <span className="block truncate text-[13px] text-[#6B6F7A]">{row.name} · {row.criterion}</span>
                        </span>
                        <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold", row.delivered ? "bg-[#E3F6EC] text-[#126B3B]" : "bg-[#ECE9E1] text-[#3A3D45]")}>
                          {row.delivered ? "Délivré" : "En attente"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, hint, violet }: { label: string; value: string; hint: string; violet?: boolean }) {
  return (
    <article className={cn("relative overflow-hidden rounded-[26px] p-[22px]", violet ? "bg-[#6E5BFF] text-white" : "bg-white")}>
      {violet ? <span className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/12" /> : null}
      <p className={cn("text-[15px] font-semibold", violet ? "text-white" : "text-[#3A3D45]")}>{label}</p>
      <p className="mt-2 text-[40px] font-extrabold leading-none tracking-[-1px]">{value}</p>
      <p className={cn("mt-2 text-[13px]", violet ? "text-white/80" : "text-[#6B6F7A]")}>{hint}</p>
    </article>
  );
}
