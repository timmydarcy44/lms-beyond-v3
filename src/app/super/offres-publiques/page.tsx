"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type PendingOffer = {
  id: string;
  title: string;
  city: string;
  contractType: string;
  companyName: string;
  createdAt: string;
};

export default function OffresPubliquesPage() {
  const [offers, setOffers] = useState<PendingOffer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/super-admin/offres-publiques", { credentials: "include" });
    const json = (await res.json()) as { offers?: PendingOffer[]; needsMigration?: boolean };
    setOffers(json.offers ?? []);
    setLoading(false);
    if (json.needsMigration) toast.error("Collez la migration 20261026200000 pour relire les offres publiques.");
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const decide = async (id: string, decision: "published" | "blocked") => {
    const res = await fetch("/api/super-admin/offres-publiques", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision }),
    });
    if (!res.ok) {
      toast.error("La décision n'a pas été enregistrée.");
      return;
    }
    setOffers((current) => current.filter((offer) => offer.id !== id));
    toast.success(decision === "published" ? "Offre visible sur byound.fr" : "Offre refusée");
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-[#12141A]">Offres à relire</h1>
      <p className="mt-2 text-sm text-[#5C616B]">
        La première offre publique d&apos;une entreprise attend ici. Le nom n&apos;est visible que dans cet écran.
      </p>
      {loading ? <p className="mt-8 text-sm text-[#6B6F7A]">Chargement…</p> : null}
      {!loading && !offers.length ? <p className="mt-8 text-sm text-[#6B6F7A]">Aucune offre en attente.</p> : null}
      <ul className="mt-6 space-y-3">
        {offers.map((offer) => (
          <li key={offer.id} className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-[#6E5BFF]">{offer.companyName}</p>
            <p className="mt-1 text-lg font-extrabold">{offer.title}</p>
            <p className="text-sm text-[#6B6F7A]">{[offer.city, offer.contractType].filter(Boolean).join(" · ")}</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => void decide(offer.id, "published")} className="h-10 rounded-full bg-[#12141A] px-4 text-sm font-semibold text-white">Publier</button>
              <button type="button" onClick={() => void decide(offer.id, "blocked")} className="h-10 rounded-full border border-[#E3E0D8] px-4 text-sm font-semibold">Refuser</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
