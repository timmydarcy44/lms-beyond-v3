"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { EnterpriseEmployeeCsvActions } from "@/components/enterprise/enterprise-employee-csv-actions";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useEntrepriseOverview } from "@/hooks/use-entreprise-overview";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-pink-500",
  "bg-blue-500",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-rose-500",
];

function initials(first: string | null, last: string | null) {
  const a = (first ?? "").trim().slice(0, 1).toUpperCase();
  const b = (last ?? "").trim().slice(0, 1).toUpperCase();
  return (a + b).trim() || "—";
}

function avatarColor(name: string) {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

export default function SalariesPage() {
  const supabase = useSupabase();
  const { loading, data, organisationId, configurationRequired, reload } = useEntrepriseOverview();
  const [clientOrgId, setClientOrgId] = useState<string | null>(null);
  useEffect(() => {
    if (organisationId) return;
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", userData.user.id)
        .maybeSingle();
      const cid = (profile as { company_id?: string | null } | null)?.company_id?.trim();
      if (cid) setClientOrgId(cid);
    })();
  }, [organisationId, supabase]);

  const effectiveOrgId = organisationId ?? clientOrgId;
  const employees = data?.employees ?? [];
  const kpis = data?.kpis;
  const diagnosticsCompleted = kpis?.diagnostics_completed ?? 0;

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const e of employees) {
      if (e.department) set.add(e.department);
    }
    return Array.from(set).sort();
  }, [employees]);

  const triggerImport = () => {
    document.getElementById("entreprise-csv-import")?.click();
  };

  return (
    <div className="flex min-h-screen bg-white text-gray-900">
      <EnterpriseSidebar />
      <main className="min-h-screen flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="w-full text-center sm:w-auto sm:text-left">
            <h1 className={ENTREPRISE_H1_CLASS}>Gestion des salariés</h1>
            <p className="mt-1 text-sm text-gray-500">
              {loading
                ? "Chargement…"
                : `${employees.length} collaborateurs · ${diagnosticsCompleted} diagnostics complétés`}
            </p>
          </div>
          {!loading ? (
            <div>
              <EnterpriseEmployeeCsvActions
                organisationId={effectiveOrgId}
                employees={employees}
                organisationName={data?.organisation?.name}
                departments={departments}
                onSuccess={() => void reload()}
              />
            </div>
          ) : null}
        </div>

        {configurationRequired && !effectiveOrgId ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Votre organisation n&apos;est pas encore liée à votre compte.{" "}
            <Link href="/onboarding" className="font-semibold underline">
              Compléter la configuration →
            </Link>
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
            Chargement de vos collaborateurs…
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
              <Users className="h-8 w-8 text-violet-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Aucun collaborateur pour le moment</h2>
            <p className="mt-2 max-w-md text-sm text-gray-500">
              Importez votre liste RH pour commencer — CSV ou Excel (.xlsx).
            </p>
            <button
              type="button"
              onClick={triggerImport}
              className="mt-6 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
            >
              📂 Importer mon fichier CSV →
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Collaborateur</th>
                  <th className="px-4 py-3">Poste</th>
                  <th className="px-4 py-3">Département</th>
                  <th className="px-4 py-3">Diagnostic</th>
                  <th className="px-4 py-3">Formation</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => {
                  const fullName =
                    [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "—";
                  const color = avatarColor(fullName);
                  return (
                    <tr key={employee.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/entreprise/salaries/${employee.id}`}
                          className="flex items-center gap-3"
                        >
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                              color,
                            )}
                          >
                            {initials(employee.first_name, employee.last_name)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{fullName}</p>
                            <p className="text-xs text-gray-400">{employee.email ?? ""}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{employee.job_title ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{employee.department ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                            employee.diagnostic_done
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500",
                          )}
                        >
                          {employee.diagnostic_done ? "Complété" : "En attente"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                            employee.formation_active
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-100 text-gray-500",
                          )}
                        >
                          {employee.formation_active ? "En cours" : "Aucune"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
