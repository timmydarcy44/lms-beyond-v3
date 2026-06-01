"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePraticien } from "@/components/praticien/praticien-context";
import { Card, KpiCard, PageWrap } from "@/components/praticien/praticien-ui";
import { formatDateFr, formatTime, nextFridayLabel } from "@/lib/marketplace/praticien-utils";
import {
  formatEurosFromCents,
  getBeyondCommissionRate,
  splitSessionAmount,
} from "@/lib/marketplace/commission";

type MonthRow = { label: string; cents: number; sessions: number };

async function fetchMonthRevenue(year: number, month: number, label: string): Promise<MonthRow> {
  const res = await fetch(`/api/marketplace/praticien/dashboard?year=${year}&month=${month}`);
  const json = (await res.json()) as { stats?: { revenusMoisCents?: number; sessionsMois?: number } };
  return {
    label,
    cents: json.stats?.revenusMoisCents ?? 0,
    sessions: json.stats?.sessionsMois ?? 0,
  };
}

export function PraticienRevenusPage() {
  const { sessionsPassees, stats, praticien } = usePraticien();
  const [months, setMonths] = useState<MonthRow[]>([]);
  const [totalLifetimeCents, setTotalLifetimeCents] = useState<number | null>(null);
  const [loadingMonths, setLoadingMonths] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingMonths(true);
      const now = new Date();
      const chartFetches: Promise<MonthRow>[] = [];
      const lifetimeFetches: Promise<MonthRow>[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        chartFetches.push(fetchMonthRevenue(d.getFullYear(), d.getMonth(), d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })));
      }
      for (let i = 0; i < 36; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        lifetimeFetches.push(
          fetchMonthRevenue(d.getFullYear(), d.getMonth(), ""),
        );
      }
      const [rows, lifetimeRows] = await Promise.all([Promise.all(chartFetches), Promise.all(lifetimeFetches)]);
      if (!cancelled) {
        setMonths(rows);
        setTotalLifetimeCents(lifetimeRows.reduce((s, r) => s + r.cents, 0));
        setLoadingMonths(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);
  const current = months[months.length - 1]?.cents ?? stats?.revenusMoisCents ?? 0;
  const previous = months[months.length - 2]?.cents ?? 0;
  const variation =
    previous > 0 ? `${(((current - previous) / previous) * 100).toFixed(1)} %` : current > 0 ? "+100 %" : "—";

  const chartData = months.map((r) => ({
    name: r.label,
    net: Math.round(r.cents / 100),
  }));

  const rate = getBeyondCommissionRate();

  const openStripe = async () => {
    const res = await fetch("/api/marketplace/praticien/stripe-login", { method: "POST" });
    const json = (await res.json()) as { url?: string; error?: string };
    if (json.url) window.location.href = json.url;
    else window.open("https://dashboard.stripe.com", "_blank");
  };

  return (
    <PageWrap title="Revenus" subtitle="Suivi de votre activité et reversements">
      <section className="grid gap-3 sm:grid-cols-2">
        <KpiCard
          label="Total encaissé depuis le début"
          value={
            loadingMonths || totalLifetimeCents == null
              ? "…"
              : formatEurosFromCents(totalLifetimeCents)
          }
        />
        <KpiCard label="Ce mois vs mois précédent" value={variation} />
      </section>

      <Card className="mt-6 h-72">
        <p className="mb-4 text-sm font-medium text-slate-300">Revenus nets par mois</p>
        {loadingMonths ? (
          <p className="text-sm text-slate-500">Chargement du graphique…</p>
        ) : (
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} unit=" €" />
              <Tooltip
                contentStyle={{ background: "#1a1d27", border: "1px solid #ffffff20", borderRadius: 8 }}
                formatter={(v: number) => [`${v} €`, "Net"]}
              />
              <Bar dataKey="net" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="mt-6">
        <p className="text-sm text-slate-400">
          Prochain reversement : <span className="text-white">{nextFridayLabel()}</span>
          {stats?.revenusMoisCents != null && stats.revenusMoisCents > 0 && (
            <> · montant estimé ce mois : <span className="font-medium text-emerald-300">{stats.revenusMois}</span></>
          )}
        </p>
        {praticien?.stripe_onboarding_complete && (
          <Button type="button" variant="link" className="mt-2 h-auto p-0 text-violet-400" onClick={() => void openStripe()}>
            <ExternalLink className="mr-1 h-4 w-4" />
            Tableau de bord Stripe
          </Button>
        )}
      </Card>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03] text-slate-400">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Prénom</th>
              <th className="px-4 py-3">Durée</th>
              <th className="px-4 py-3">Brut</th>
              <th className="px-4 py-3">Commission Beyond</th>
              <th className="px-4 py-3">Net reçu</th>
            </tr>
          </thead>
          <tbody>
            {sessionsPassees.map((s) => {
              const netCents = Number(s.montant_praticien ?? 0);
              const gross = Math.round(netCents / (1 - rate));
              const { commissionBeyond } = splitSessionAmount(gross);
              return (
                <tr key={s.id} className="border-b border-white/5">
                  <td className="px-4 py-3">
                    {formatDateFr(s.date_session)} · {formatTime(s.heure_debut)}
                  </td>
                  <td className="px-4 py-3 text-slate-400">—</td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">{formatEurosFromCents(gross)}</td>
                  <td className="px-4 py-3">{formatEurosFromCents(commissionBeyond)}</td>
                  <td className="px-4 py-3 font-medium">{s.montantLabel ?? formatEurosFromCents(netCents)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sessionsPassees.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">Aucune session payée enregistrée.</p>
        )}
      </div>
    </PageWrap>
  );
}
