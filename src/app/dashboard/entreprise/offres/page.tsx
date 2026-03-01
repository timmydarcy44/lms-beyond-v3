"use client";

import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { Plus } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

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

export default function EntrepriseOffresPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <EnterpriseSidebar />
      <main className="min-h-screen px-8 py-10 pl-[260px]">
        <div className="space-y-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[26px] font-extrabold text-[#007BFF]">Gestion des Offres</h1>
              <p className="mt-1 text-[12px] text-white/60">
                Pilotez vos recrutements par les compétences et le potentiel d&apos;adaptabilité.
              </p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-[#007BFF] px-4 py-2 text-[12px] font-semibold text-black shadow-[0_0_18px_rgba(0,123,255,0.45)]">
              <Plus size={14} />
              Créer une nouvelle offre
            </button>
          </header>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-[22px] border border-white/10 bg-white/5 p-5 shadow-[0_14px_30px_rgba(0,0,0,0.4)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[16px] font-extrabold text-white">{offer.title}</div>
                    <div className="mt-1 text-[11px] text-white/60">
                      {offer.status === "Active" ? "🟢 Active" : "🟡 En pause"}
                    </div>
                  </div>
                  <span className="rounded-full border border-[#007BFF]/40 bg-[#007BFF]/10 px-3 py-1 text-[11px] text-[#7FB7FF]">
                    {offer.contract}
                  </span>
                </div>

                <div className="mt-4 h-[140px] rounded-[16px] border border-white/10 bg-[#0B0B0B] p-3">
                  <div className="text-[11px] text-white/60">Target Radar</div>
                  <div className="mt-2 h-[100px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={offer.radar}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="skill" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 9 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} />
                        <Radar dataKey="value" stroke="#007BFF" fill="rgba(0,123,255,0.25)" />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="mt-4 text-[12px] text-white/70">
                  {offer.matches} talents correspondent à +85% dans votre vivier
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`/dashboard/entreprise/offres/${offer.id}/candidats`}
                    className="rounded-full bg-[#007BFF] px-3 py-2 text-[11px] font-semibold text-black"
                  >
                    Voir les candidats
                  </a>
                  <button className="rounded-full border border-white/10 px-3 py-2 text-[11px] text-white/70">
                    Modifier
                  </button>
                  <button className="rounded-full border border-white/10 px-3 py-2 text-[11px] text-white/70">
                    Suspendre
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className="rounded-[20px] border border-white/10 bg-white/5 p-5">
            <div className="text-[14px] font-semibold text-white">Brouillons</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between rounded-[16px] border border-white/10 bg-[#0B0B0B] px-4 py-3 text-[12px]"
                >
                  <div>
                    <div className="text-white">{draft.title}</div>
                    <div className="text-white/50">{draft.contract}</div>
                  </div>
                  <button className="rounded-full border border-[#007BFF]/40 px-3 py-1 text-[11px] text-[#7FB7FF]">
                    Reprendre
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
