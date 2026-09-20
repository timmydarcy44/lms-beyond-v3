"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, UserPlus, Users } from "lucide-react";

import {
  INSTRUCTOR_STATUS_LABELS,
} from "@/lib/ecole/instructors";

type Stats = {
  total: number;
  active: number;
  invited: number;
  incomplete: number;
  inactive: number;
  hours_total: number;
};

export default function FormateursOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/ecole/formateurs", { credentials: "include" });
      const json = await res.json();
      setStats(json.stats ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = [
    { label: "Formateurs", value: stats?.total ?? 0, href: "/dashboard/ecole/formateurs/liste" },
    { label: "Actifs", value: stats?.active ?? 0, href: "/dashboard/ecole/formateurs/liste" },
    { label: "Invités", value: stats?.invited ?? 0, href: "/dashboard/ecole/formateurs/liste" },
    {
      label: "Heures affectées",
      value: `${stats?.hours_total ?? 0} h`,
      href: "/dashboard/ecole/planning",
    },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Formateurs</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Vue d&apos;ensemble</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Pilotez vos intervenants pédagogiques, invitations et candidatures — puis affectez-les au planning.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/ecole/formateurs/liste?action=add"
            className="inline-flex items-center gap-2 rounded-xl bg-[#3D7BFF] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Ajouter un formateur
          </Link>
          <Link
            href="/dashboard/ecole/formateurs/liste?action=invite"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            <UserPlus className="h-4 w-4" />
            Inviter un formateur
          </Link>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-[#3D7BFF]/30"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? "…" : c.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Link
          href="/dashboard/ecole/formateurs/liste"
          className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D7BFF]/10 text-[#3D7BFF]">
            <Users className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-slate-900">Formateurs</span>
            <span className="mt-1 block text-sm text-slate-500">
              Annuaire, disponibilités, volumes horaires affectés.
            </span>
            <span className="mt-2 block text-xs text-slate-400">
              {Object.values(INSTRUCTOR_STATUS_LABELS).join(" · ")}
            </span>
          </span>
        </Link>
        <Link
          href="/dashboard/ecole/formateurs/candidats"
          className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <UserPlus className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-slate-900">Candidats formateurs</span>
            <span className="mt-1 block text-sm text-slate-500">
              Pipeline de recrutement séparé des formateurs actifs.
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
