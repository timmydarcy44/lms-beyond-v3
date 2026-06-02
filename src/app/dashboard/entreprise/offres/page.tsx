"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { OffresFormationsSection } from "@/components/enterprise/offres-formations-section";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import { cn } from "@/lib/utils";

const offers = [
  {
    id: "offer-1",
    title: "Chef de Projet Digital",
    contract: "Alternance",
    status: "Active",
    matches: 12,
    radar: [
      { skill: "Leadership", value: 78 },
      { skill: "Organisation", value: 72 },
      { skill: "Créativité", value: 70 },
      { skill: "Collaboration", value: 80 },
      { skill: "Adaptabilité", value: 74 },
    ],
  },
  {
    id: "offer-2",
    title: "Analyste Data Senior",
    contract: "CDI",
    status: "Active",
    matches: 5,
    radar: [
      { skill: "Analyse", value: 88 },
      { skill: "Rigueur", value: 84 },
      { skill: "Problèmes", value: 82 },
      { skill: "Communication", value: 68 },
      { skill: "Adaptabilité", value: 70 },
    ],
  },
  {
    id: "offer-3",
    title: "Assistant RH",
    contract: "Stage",
    status: "En pause",
    matches: 18,
    radar: [
      { skill: "Empathie", value: 78 },
      { skill: "Organisation", value: 72 },
      { skill: "Communication", value: 80 },
      { skill: "Suivi", value: 76 },
      { skill: "Rigueur", value: 70 },
    ],
  },
];

const drafts = [
  { id: "draft-1", title: "Chargé CRM", contract: "CDI" },
  { id: "draft-2", title: "Assistant Marketing", contract: "Alternance" },
];

function OffresEmploiSection() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end">
        <Link
          href="/dashboard/entreprise/offres/creer"
          className="inline-flex items-center gap-2 rounded-full bg-[#007BFF] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_18px_rgba(0,123,255,0.35)]"
        >
          <Plus size={14} />
          Créer une nouvelle offre
        </Link>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="rounded-[22px] border border-gray-100 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-extrabold text-gray-900">{offer.title}</div>
                <div className="mt-1 text-xs text-gray-500">
                  {offer.status === "Active" ? "🟢 Active" : "🟡 En pause"}
                </div>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700">
                {offer.contract}
              </span>
            </div>

            <div className="mt-4 h-[140px] rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <div className="text-xs text-gray-500">Target Radar</div>
              <div className="mt-2 h-[100px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={offer.radar}>
                    <PolarGrid stroke="rgba(0,0,0,0.08)" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: "rgba(0,0,0,0.5)", fontSize: 9 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} />
                    <Radar dataKey="value" stroke="#007BFF" fill="rgba(0,123,255,0.25)" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-600">
              {offer.matches} talents correspondent à +85% dans votre vivier
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/dashboard/entreprise/offres/${offer.id}/candidats`}
                className="rounded-full bg-[#007BFF] px-3 py-2 text-xs font-semibold text-white"
              >
                Voir les candidats
              </Link>
              <button type="button" className="rounded-full border border-gray-200 px-3 py-2 text-xs text-gray-600">
                Modifier
              </button>
              <button type="button" className="rounded-full border border-gray-200 px-3 py-2 text-xs text-gray-600">
                Suspendre
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-gray-900">Brouillons</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs"
            >
              <div>
                <div className="font-medium text-gray-900">{draft.title}</div>
                <div className="text-gray-500">{draft.contract}</div>
              </div>
              <button type="button" className="rounded-full border border-blue-200 px-3 py-1 text-xs text-blue-700">
                Reprendre
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
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
            Offres d&apos;emploi et formations pour votre organisation
          </p>
        </header>

        <div className="mb-8 flex justify-center gap-2">
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

        {tab === "emploi" ? <OffresEmploiSection /> : <OffresFormationsSection />}
      </main>
    </div>
  );
}
