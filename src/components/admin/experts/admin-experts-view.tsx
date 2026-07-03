"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { expertReviewStatusLabel } from "@/lib/expert/expert-access";
import type { AdminExpertRow } from "@/lib/expert/admin-expert-types";

const FILTERS = [
  { id: "all", label: "Tous" },
  { id: "pending_review", label: "En attente" },
  { id: "approved", label: "Validés" },
  { id: "rejected", label: "Refusés" },
  { id: "needs_info", label: "Infos demandées" },
] as const;

function statusBadgeClass(status: string | null | undefined): string {
  switch (status) {
    case "approved":
      return "border-[#635BFF]/25 bg-[#635BFF]/10 text-[#4f46e5]";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-700";
    case "needs_info":
      return "border-amber-200 bg-amber-50 text-amber-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

type Props = {
  experts: AdminExpertRow[];
  activeFilter: string;
  basePath?: string;
};

export function AdminExpertsView({ experts, activeFilter, basePath = "/admin/experts" }: Props) {
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: experts.length };
    for (const e of experts) {
      const key = e.review_status || "pending_review";
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [experts]);

  const filteredExperts = useMemo(() => {
    let list = experts;
    if (activeFilter !== "all") {
      list = list.filter((e) => (e.review_status || "pending_review") === activeFilter);
    }
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((e) => {
      const name = `${e.first_name ?? ""} ${e.last_name ?? ""}`.toLowerCase();
      const specs = (e.specialties ?? []).join(" ").toLowerCase();
      return (
        name.includes(q) ||
        (e.email ?? "").toLowerCase().includes(q) ||
        (e.headline ?? "").toLowerCase().includes(q) ||
        specs.includes(q)
      );
    });
  }, [experts, activeFilter, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Experts / Formateurs</h1>
        <p className="mt-1 text-sm text-slate-600">Validation des candidatures formateurs et experts EDGE.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, email, spécialité…"
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#635BFF]/40"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={f.id === "all" ? basePath : `${basePath}?status=${f.id}`}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              activeFilter === f.id
                ? "border-[#635BFF] bg-[#635BFF] text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
            )}
          >
            {f.label}
            <span className="ml-2 opacity-70">({counts[f.id] ?? 0})</span>
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Spécialités</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Soumis le</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filteredExperts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Aucun profil expert pour ce filtre.
                </td>
              </tr>
            ) : (
              filteredExperts.map((expert) => {
                const name = `${expert.first_name ?? ""} ${expert.last_name ?? ""}`.trim() || "—";
                return (
                  <tr key={expert.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{name}</td>
                    <td className="px-4 py-3 text-slate-600">{expert.email ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {(expert.specialties ?? []).slice(0, 2).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                          statusBadgeClass(expert.review_status),
                        )}
                      >
                        {expertReviewStatusLabel(expert.review_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {expert.created_at ? new Date(expert.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`${basePath}/${expert.id}`}
                        className="font-semibold text-[#635BFF] hover:underline"
                      >
                        Voir la fiche
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
