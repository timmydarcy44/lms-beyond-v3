"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type DashboardData = {
  praticien?: { id: string; prenom: string; stripe_onboarding_complete: boolean; bct_certified: boolean };
  stats?: { sessionsMois: number; aVenir: number; revenusMois: string };
  prochainesSessions?: Array<{
    id: string;
    date_session: string;
    heure_debut: string;
    duree_minutes: number;
    consentement_donnees: boolean;
    profiles?: { first_name?: string; full_name?: string } | { first_name?: string; full_name?: string }[];
  }>;
};

export default function PraticienDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingStripe, setLoadingStripe] = useState(false);

  const load = () => {
    void fetch("/api/marketplace/praticien/dashboard")
      .then((r) => r.json())
      .then((j) => setData(j as DashboardData));
  };

  useEffect(() => {
    load();
  }, []);

  const startStripe = async () => {
    if (!data?.praticien?.id) return;
    setLoadingStripe(true);
    try {
      const res = await fetch("/api/marketplace/praticien/stripe-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ praticienId: data.praticien.id }),
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Erreur Stripe");
      window.location.href = json.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Stripe indisponible");
    } finally {
      setLoadingStripe(false);
    }
  };

  const praticien = data?.praticien;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold">Bonjour {praticien?.prenom ?? "Praticien"} 👋</h1>

        {!praticien?.stripe_onboarding_complete && (
          <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="text-sm">Configurez Stripe Connect pour recevoir vos reversements (85 %).</p>
            <Button className="mt-3" onClick={() => void startStripe()} disabled={loadingStripe}>
              {loadingStripe ? "Redirection…" : "Configurer Stripe Connect →"}
            </Button>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">Sessions ce mois</p>
            <p className="text-2xl font-bold">{data?.stats?.sessionsMois ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">À venir</p>
            <p className="text-2xl font-bold">{data?.stats?.aVenir ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-400">Revenus ce mois</p>
            <p className="text-2xl font-bold">{data?.stats?.revenusMois ?? "0 €"}</p>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="font-semibold">📅 Mes prochaines sessions</h2>
          <ul className="mt-4 space-y-3">
            {(data?.prochainesSessions ?? []).map((s) => {
              const prof = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
              const name = prof?.first_name || prof?.full_name?.split(" ")[0] || "Collaborateur";
              return (
                <li key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                  <p>
                    {new Date(s.date_session).toLocaleDateString("fr-FR")} —{" "}
                    {String(s.heure_debut).slice(0, 5)} · {name} · {s.duree_minutes} min
                  </p>
                  <p className="mt-1 text-slate-400">
                    {s.consentement_donnees ? "Profil Beyond partagé" : "Profil non partagé"}
                  </p>
                </li>
              );
            })}
            {(data?.prochainesSessions ?? []).length === 0 && (
              <p className="text-slate-500">Aucune session à venir.</p>
            )}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="font-semibold">📆 Disponibilités</h2>
          <p className="mt-2 text-sm text-slate-400">
            Ajoutez des créneaux via l&apos;API praticien (interface calendrier à venir).
          </p>
          <Link href="/dashboard/praticien/disponibilites" className="mt-2 inline-block text-violet-400">
            Gérer mes créneaux →
          </Link>
        </section>
      </main>
    </div>
  );
}
