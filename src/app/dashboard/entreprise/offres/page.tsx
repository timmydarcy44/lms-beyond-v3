"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Plus } from "lucide-react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { OffresFormationsSection } from "@/components/enterprise/offres-formations-section";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import { cn } from "@/lib/utils";

type OfferCard = {
  id: string;
  title: string | null;
  description: string | null;
  city: string | null;
  salary_range: string | null;
  contract_type: string | null;
  status: string | null;
  applications_count: number;
};

function truncateText(value: string | null | undefined, max = 180) {
  const text = String(value ?? "").trim();
  if (!text) return "Description non renseignée.";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

function formatCompensation(offer: OfferCard) {
  if (!offer.salary_range) return null;
  const base = offer.salary_range.includes("€") ? offer.salary_range : `${offer.salary_range} €`;
  return (offer.contract_type || "").toLowerCase().includes("freelance") ? `${base} / jour` : `${base} / an`;
}

function OfferCardGrid() {
  const [offers, setOffers] = useState<OfferCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOffers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/dashboard/entreprise/job-offers", { credentials: "include" });
        const payload = (await response.json()) as { offers?: OfferCard[]; error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "Impossible de charger les offres");
        }
        setOffers(Array.isArray(payload.offers) ? payload.offers : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger les offres");
      } finally {
        setLoading(false);
      }
    };

    void loadOffers();
  }, []);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Chargement des offres...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-red-100 bg-red-50 p-6 shadow-sm">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-gray-200 bg-[#fafafa] p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <BriefcaseBusiness className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">Aucune offre publiée</h2>
        <p className="mt-2 text-sm text-gray-500">
          Créez votre première offre pour commencer à recevoir des candidatures.
        </p>
      </div>
    );
  }

  return (
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {offers.map((offer) => (
        <Link
          key={offer.id}
          href={`/dashboard/entreprise/offres/${offer.id}`}
          className="group rounded-[28px] border border-gray-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(15,23,42,0.09)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-gray-900">{offer.title || "Offre sans titre"}</div>
              <p className="mt-2 text-sm text-gray-500">
                {[offer.contract_type, offer.city].filter(Boolean).join(" · ") || "Informations à compléter"}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                offer.status === "closed"
                  ? "border border-amber-200 bg-amber-50 text-amber-700"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-700",
              )}
            >
              {offer.status === "closed" ? "Clôturée" : "Active"}
            </span>
          </div>

          <p className="mt-5 min-h-[88px] text-sm leading-6 text-gray-600">
            {truncateText(offer.description)}
          </p>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-100 pt-5">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Candidatures</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{offer.applications_count}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Rémunération</p>
              <p className="mt-1 text-sm font-medium text-gray-700">
                {formatCompensation(offer) || "Non précisée"}
              </p>
            </div>
          </div>

          <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-700">
            Voir l&apos;offre
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </div>
        </Link>
      ))}
    </section>
  );
}

export default function EntrepriseOffresPage() {
  const [tab, setTab] = useState<"emploi" | "formation">("emploi");

  return (
    <div className="flex min-h-screen bg-white text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-8">
          <h1 className={ENTREPRISE_H1_CLASS}>Mes Offres</h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Vos offres d&apos;emploi et de formation, dans une vue plus claire et orientée action.
          </p>
        </header>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            {(
              [
                { key: "emploi" as const, label: "Offres d'emploi" },
                { key: "formation" as const, label: "Offres de formation" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-xl px-5 py-2.5 text-sm font-semibold transition",
                  tab === t.key
                    ? "bg-violet-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "emploi" ? (
            <Link
              href="/dashboard/entreprise/offres/creer"
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.22)] transition hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" />
              Créer une offre
            </Link>
          ) : null}
        </div>

        {tab === "emploi" ? <OfferCardGrid /> : <OffresFormationsSection />}
      </main>
    </div>
  );
}
