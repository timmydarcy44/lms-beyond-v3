"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { Button } from "@/components/ui/button";
import { formatEurosFromCents } from "@/lib/marketplace/commission";
import type { PraticienBct, PraticienCreneau } from "@/lib/marketplace/types";

export default function PraticienProfilePage() {
  const { praticienId } = useParams<{ praticienId: string }>();
  const router = useRouter();
  const [praticien, setPraticien] = useState<PraticienBct | null>(null);
  const [creneaux, setCreneaux] = useState<PraticienCreneau[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedCreneau, setSelectedCreneau] = useState<PraticienCreneau | null>(null);

  useEffect(() => {
    void (async () => {
      const [pRes, cRes] = await Promise.all([
        fetch(`/api/marketplace/praticiens/${praticienId}`),
        fetch(`/api/marketplace/praticiens/${praticienId}/creneaux`),
      ]);
      const pJson = (await pRes.json()) as { praticien?: PraticienBct };
      const cJson = (await cRes.json()) as { creneaux?: PraticienCreneau[] };
      if (pRes.ok) setPraticien(pJson.praticien ?? null);
      if (cRes.ok) setCreneaux(cJson.creneaux ?? []);
    })();
  }, [praticienId]);

  const daysWithSlots = useMemo(() => {
    const set = new Set(creneaux.map((c) => c.date));
    return Array.from(set).sort();
  }, [creneaux]);

  const slotsForDay = useMemo(
    () => creneaux.filter((c) => c.date === selectedDay),
    [creneaux, selectedDay],
  );

  if (!praticien) {
    return (
      <div className="min-h-screen bg-slate-50 pl-[260px]">
        <EnterpriseSidebar />
        <main className="p-10 text-slate-500">Chargement…</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pl-[260px]">
      <EnterpriseSidebar />
      <main className="mx-auto max-w-4xl px-8 py-10">
        <Link href="/dashboard/entreprise/marketplace" className="text-sm text-violet-700">
          ← Retour à la marketplace
        </Link>

        <div className="mt-6 grid gap-8 md:grid-cols-[200px_1fr]">
          <div className="text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-violet-100 text-4xl">
              📷
            </div>
            <p className="mt-3 text-xs font-semibold text-emerald-700">✅ BCT Certifié</p>
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {praticien.prenom} {praticien.nom}
            </h1>
            <p className="text-slate-600">{praticien.titre}</p>
            <p className="mt-2 text-sm text-slate-500">{(praticien.specialites ?? []).join(" · ")}</p>
          </div>
        </div>

        {praticien.biographie && (
          <section className="mt-8 rounded-xl border bg-white p-6">
            <h2 className="font-semibold">À propos</h2>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{praticien.biographie}</p>
          </section>
        )}

        <section className="mt-8 rounded-xl border bg-white p-6">
          <h2 className="font-semibold">📅 Choisir un créneau</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {daysWithSlots.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setSelectedDay(d);
                  setSelectedCreneau(null);
                }}
                className={`rounded-full px-3 py-1 text-sm ${
                  selectedDay === d ? "bg-violet-700 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
              </button>
            ))}
          </div>

          {selectedDay && (
            <div className="mt-4 flex flex-wrap gap-2">
              {slotsForDay.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCreneau(c)}
                  className={`rounded-lg border px-4 py-2 text-sm ${
                    selectedCreneau?.id === c.id
                      ? "border-violet-600 bg-violet-50"
                      : "border-slate-200"
                  }`}
                >
                  {String(c.heure_debut).slice(0, 5)}
                </button>
              ))}
            </div>
          )}

          {selectedCreneau && (
            <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm">
              <p>
                Session : {new Date(selectedCreneau.date).toLocaleDateString("fr-FR")} à{" "}
                {String(selectedCreneau.heure_debut).slice(0, 5)}
              </p>
              <p>Durée : {praticien.duree_session} min</p>
              <p className="font-semibold">Tarif : {formatEurosFromCents(praticien.tarif_session)}</p>
              <Button
                className="mt-4"
                onClick={() =>
                  router.push(
                    `/dashboard/entreprise/marketplace/${praticienId}/reserver?creneau=${selectedCreneau.id}`,
                  )
                }
              >
                Confirmer et payer →
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
