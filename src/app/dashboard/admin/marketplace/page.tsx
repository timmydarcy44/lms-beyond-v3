"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  praticiensActifs: number;
  sessionsMois: number;
  commissionMois: string;
  praticiens: Array<{
    id: string;
    prenom: string;
    nom: string;
    sessions: number;
    brutLabel: string;
    netLabel: string;
  }>;
};

export default function AdminMarketplacePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void fetch("/api/marketplace/admin/stats")
      .then((r) => r.json())
      .then((j) => setStats(j as Stats));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Marketplace BCT — Admin</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Praticiens actifs</p>
          <p className="text-2xl font-bold">{stats?.praticiensActifs ?? "—"}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Sessions ce mois</p>
          <p className="text-2xl font-bold">{stats?.sessionsMois ?? "—"}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Commission Beyond</p>
          <p className="text-2xl font-bold">{stats?.commissionMois ?? "—"}</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-semibold">Praticiens</h2>
        <ul className="mt-4 space-y-2">
          {(stats?.praticiens ?? []).map((p) => (
            <li key={p.id} className="rounded-lg border bg-white px-4 py-3 text-sm">
              {p.prenom} {p.nom} · {p.sessions} sessions · {p.brutLabel} → {p.netLabel} net
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-sm text-slate-500">
        Pour inviter un praticien : créer une ligne dans{" "}
        <code className="rounded bg-slate-100 px-1">praticiens_bct</code> liée à son{" "}
        <code className="rounded bg-slate-100 px-1">user_id</code>, certifier BCT, puis onboarding Stripe.
      </p>
      <Link href="/super/crm/onboarding" className="mt-4 inline-block text-violet-700 text-sm">
        ← Retour admin
      </Link>
    </main>
  );
}
