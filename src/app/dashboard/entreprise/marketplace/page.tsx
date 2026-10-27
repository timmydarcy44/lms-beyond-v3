"use client";

import { useEffect, useState } from "react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { MarketplaceUpgradeCta } from "@/components/marketplace/marketplace-upgrade-cta";
import { PraticienCard } from "@/components/marketplace/praticien-card";
import type { PraticienBct } from "@/lib/marketplace/types";

export default function EntrepriseMarketplacePage() {
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState(1);
  const [praticiens, setPraticiens] = useState<PraticienBct[]>([]);
  const [specialite, setSpecialite] = useState("");
  const [langue, setLangue] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (specialite) params.set("specialite", specialite);
      if (langue) params.set("langue", langue);
      const res = await fetch(`/api/marketplace/praticiens?${params}`);
      const json = (await res.json()) as {
        praticiens?: PraticienBct[];
        tier?: number;
        error?: string;
      };
      setTier(json.tier ?? 1);
      if (res.ok) setPraticiens(json.praticiens ?? []);
      setLoading(false);
    })();
  }, [specialite, langue]);

  const allSpecialites = Array.from(
    new Set(praticiens.flatMap((p) => p.specialites ?? [])),
  ).sort();

  return (
    <div className="min-h-screen bg-slate-50 pl-[260px]">
      <EnterpriseSidebar />
      <main className="mx-auto max-w-6xl px-8 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">🧠 Psychopédagogues certifiés Beyond</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Des experts qualifiés, sélectionnés et certifiés par Beyond pour accompagner vos collaborateurs.
          </p>
        </header>

        {tier < 3 && !loading ? (
          <MarketplaceUpgradeCta tier={tier} />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-3">
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={specialite}
                onChange={(e) => setSpecialite(e.target.value)}
              >
                <option value="">Spécialité</option>
                {allSpecialites.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={langue}
                onChange={(e) => setLangue(e.target.value)}
              >
                <option value="">Langue</option>
                <option value="Français">Français</option>
                <option value="Anglais">Anglais</option>
              </select>
            </div>

            {loading ? (
              <p className="text-slate-500">Chargement…</p>
            ) : praticiens.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
                Aucun praticien disponible pour le moment.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {praticiens.map((p) => (
                  <PraticienCard key={p.id} praticien={p} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
