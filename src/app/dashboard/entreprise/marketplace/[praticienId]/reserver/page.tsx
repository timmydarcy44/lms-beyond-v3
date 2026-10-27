"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { BookingWizard } from "@/components/marketplace/booking-wizard";
import type { PraticienBct, PraticienCreneau } from "@/lib/marketplace/types";

export default function ReserverPage() {
  const { praticienId } = useParams<{ praticienId: string }>();
  const searchParams = useSearchParams();
  const creneauId = searchParams.get("creneau");
  const [praticien, setPraticien] = useState<PraticienBct | null>(null);
  const [creneau, setCreneau] = useState<PraticienCreneau | null>(null);

  useEffect(() => {
    void (async () => {
      const pRes = await fetch(`/api/marketplace/praticiens/${praticienId}`);
      const pJson = (await pRes.json()) as { praticien?: PraticienBct };
      if (pRes.ok) setPraticien(pJson.praticien ?? null);

      if (creneauId) {
        const cRes = await fetch(`/api/marketplace/praticiens/${praticienId}/creneaux`);
        const cJson = (await cRes.json()) as { creneaux?: PraticienCreneau[] };
        const found = (cJson.creneaux ?? []).find((c) => c.id === creneauId);
        setCreneau(found ?? null);
      }
    })();
  }, [praticienId, creneauId]);

  if (!praticien || !creneau || !creneauId) {
    return (
      <div className="min-h-screen bg-slate-50 pl-[260px]">
        <EnterpriseSidebar />
        <main className="p-10">
          <p className="text-slate-500">Créneau invalide.</p>
          <Link href={`/dashboard/entreprise/marketplace/${praticienId}`} className="text-violet-700">
            ← Choisir un créneau
          </Link>
        </main>
      </div>
    );
  }

  const dateLabel = `${new Date(creneau.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })} à ${String(creneau.heure_debut).slice(0, 5)}`;

  return (
    <div className="min-h-screen bg-slate-50 pl-[260px]">
      <EnterpriseSidebar />
      <main className="px-8 py-10">
        <Link href={`/dashboard/entreprise/marketplace/${praticienId}`} className="text-sm text-violet-700">
          ← Retour
        </Link>
        <BookingWizard
          praticienId={praticienId}
          praticienName={`${praticien.prenom} ${praticien.nom}`}
          creneauId={creneauId}
          dateLabel={dateLabel}
          tarifCents={praticien.tarif_session}
          dureeMinutes={praticien.duree_session}
        />
      </main>
    </div>
  );
}
