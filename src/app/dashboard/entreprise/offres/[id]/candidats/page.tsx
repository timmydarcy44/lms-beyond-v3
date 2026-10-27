"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import Link from "next/link";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Candidate = {
  id: string;
  name: string;
  availability: "Disponible immédiatement" | "En recherche active" | "À l'écoute d'opportunités";
  mobility: string;
  lastCompany: string;
  avatar: string;
  match: number;
  idmc: number;
  disc: string;
  softSkills: Array<{ label: string; value: number }>;
  offerRadar: Array<{ axis: string; value: number }>;
  candidateRadar: Array<{ axis: string; value: number }>;
  idmcAxes: Array<{ axis: string; value: number }>;
  analysis: string;
};

const OFFER_LABELS: Record<string, string> = {
  "offer-1": "Chef de Projet Digital",
  "offer-2": "Analyste Data Senior",
  "offer-3": "Assistant RH",
};

const CANDIDATES: Candidate[] = [
  {
    id: "c-01",
    name: "Marc Lefebvre",
    availability: "Disponible immédiatement",
    mobility: "Mobile Normandie",
    lastCompany: "Agence Northwave",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    match: 96,
    idmc: 92,
    disc: "Dominant",
    softSkills: [
      { label: "Leadership", value: 88 },
      { label: "Organisation", value: 84 },
      { label: "Résilience", value: 82 },
    ],
    offerRadar: [
      { axis: "Leadership", value: 78 },
      { axis: "Organisation", value: 72 },
      { axis: "Créativité", value: 70 },
      { axis: "Collaboration", value: 80 },
      { axis: "Adaptabilité", value: 74 },
    ],
    candidateRadar: [
      { axis: "Leadership", value: 82 },
      { axis: "Organisation", value: 76 },
      { axis: "Créativité", value: 68 },
      { axis: "Collaboration", value: 79 },
      { axis: "Adaptabilité", value: 77 },
    ],
    idmcAxes: [
      { axis: "Connaissance de soi", value: 82 },
      { axis: "Maîtrise des méthodes", value: 78 },
      { axis: "Adaptation au contexte", value: 85 },
      { axis: "Organisation", value: 80 },
      { axis: "Traitement de l'info", value: 76 },
      { axis: "Résolution de problèmes", value: 84 },
      { axis: "Suivi", value: 72 },
      { axis: "Auto-évaluation", value: 78 },
    ],
    analysis:
      "Ce candidat présente un profil à très forte montée en compétences. IDMC 92 et Test comportemental Dominant : un potentiel immédiat pour piloter des missions critiques et évoluer rapidement.",
  },
  {
    id: "c-02",
    name: "Léa Vasseur",
    availability: "En recherche active",
    mobility: "Mobile Caen & Paris",
    lastCompany: "Studio Axis",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
    match: 89,
    idmc: 78,
    disc: "Collaboratif",
    softSkills: [
      { label: "Collaboration", value: 86 },
      { label: "Communication", value: 80 },
      { label: "Empathie", value: 78 },
    ],
    offerRadar: [
      { axis: "Leadership", value: 78 },
      { axis: "Organisation", value: 72 },
      { axis: "Créativité", value: 70 },
      { axis: "Collaboration", value: 80 },
      { axis: "Adaptabilité", value: 74 },
    ],
    candidateRadar: [
      { axis: "Leadership", value: 68 },
      { axis: "Organisation", value: 70 },
      { axis: "Créativité", value: 64 },
      { axis: "Collaboration", value: 86 },
      { axis: "Adaptabilité", value: 72 },
    ],
    idmcAxes: [
      { axis: "Connaissance de soi", value: 66 },
      { axis: "Maîtrise des méthodes", value: 62 },
      { axis: "Adaptation au contexte", value: 70 },
      { axis: "Organisation", value: 68 },
      { axis: "Traitement de l'info", value: 60 },
      { axis: "Résolution de problèmes", value: 64 },
      { axis: "Suivi", value: 58 },
      { axis: "Auto-évaluation", value: 61 },
    ],
    analysis:
      "Ce candidat dispose d’un socle collaboratif solide. IDMC 78 : capacité d’adaptation rapide et montée en compétences structurée.",
  },
  {
    id: "c-03",
    name: "Thomas Roux",
    availability: "À l'écoute d'opportunités",
    mobility: "Mobile Rouen",
    lastCompany: "DataNova",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    match: 84,
    idmc: 72,
    disc: "Technique",
    softSkills: [
      { label: "Rigueur", value: 84 },
      { label: "Analyse", value: 80 },
      { label: "Fiabilité", value: 76 },
    ],
    offerRadar: [
      { axis: "Leadership", value: 78 },
      { axis: "Organisation", value: 72 },
      { axis: "Créativité", value: 70 },
      { axis: "Collaboration", value: 80 },
      { axis: "Adaptabilité", value: 74 },
    ],
    candidateRadar: [
      { axis: "Leadership", value: 60 },
      { axis: "Organisation", value: 74 },
      { axis: "Créativité", value: 58 },
      { axis: "Collaboration", value: 64 },
      { axis: "Adaptabilité", value: 66 },
    ],
    idmcAxes: [
      { axis: "Connaissance de soi", value: 60 },
      { axis: "Maîtrise des méthodes", value: 72 },
      { axis: "Adaptation au contexte", value: 58 },
      { axis: "Organisation", value: 70 },
      { axis: "Traitement de l'info", value: 64 },
      { axis: "Résolution de problèmes", value: 62 },
      { axis: "Suivi", value: 54 },
      { axis: "Auto-évaluation", value: 52 },
    ],
    analysis:
      "Ce candidat possède une base technique fiable. IDMC 72 : progression possible avec un cadre de pilotage clair.",
  },
];

export default function MatchingCandidatsPage() {
  const params = useParams();
  const offerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const offerTitle = OFFER_LABELS[offerId ?? "offer-1"] ?? "Offre";
  const [sortBy, setSortBy] = useState("matching");
  const [selected, setSelected] = useState<Candidate | null>(null);

  const sortedCandidates = useMemo(() => {
    const list = [...CANDIDATES];
    if (sortBy === "matching") return list.sort((a, b) => b.match - a.match);
    if (sortBy === "idmc") return list.sort((a, b) => b.idmc - a.idmc);
    return list;
  }, [sortBy]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <EnterpriseSidebar />
      <main className="min-h-screen px-8 py-10 pl-[260px]">
        <div className="space-y-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-[24px] font-extrabold text-[#007BFF]">
                Candidats pour : {offerTitle}
              </h1>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-[80px] w-[120px] rounded-[14px] border border-white/10 bg-[#0B0B0B] p-2">
                  <div className="text-[10px] text-white/60">Target Radar</div>
                  <div className="mt-1 h-[52px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={CANDIDATES[0].offerRadar}>
                        <PolarGrid stroke="rgba(255,255,255,0.08)" />
                        <PolarAngleAxis dataKey="axis" tick={false} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} />
                        <Radar dataKey="value" stroke="#007BFF" fill="rgba(0,123,255,0.2)" />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="text-[12px] text-white/60">
                  Radar cible pour comparer les candidats
                </div>
              </div>
            </div>
            <div className="min-w-[220px]">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="border-white/10 bg-[#0B0B0B] text-white/80">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matching">% de Matching</SelectItem>
                  <SelectItem value="idmc">Potentiel IDMC</SelectItem>
                  <SelectItem value="skills">Soft Skills</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </header>

          <section className="space-y-5">
            {sortedCandidates.map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => setSelected(candidate)}
                className="w-full rounded-[22px] border border-white/10 bg-white/5 p-5 text-left shadow-[0_14px_30px_rgba(0,0,0,0.4)] transition hover:border-white/20"
              >
                <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr_1.2fr]">
                  <div className="flex items-center gap-4">
                    <img
                      src={candidate.avatar}
                      alt={candidate.name}
                      className="h-14 w-14 rounded-full border border-white/10 object-cover"
                    />
                    <div>
                    <div className="text-[16px] font-bold text-white">{candidate.name}</div>
                    <div className="text-[12px] text-white/60">{candidate.mobility}</div>
                    <div
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-[10px] font-semibold ${
                        candidate.availability === "Disponible immédiatement"
                          ? "bg-[#16A34A]/20 text-[#7CFFB2] border border-[#16A34A]/40"
                          : candidate.availability === "En recherche active"
                            ? "bg-[#007BFF]/20 text-[#7FB7FF] border border-[#007BFF]/40"
                            : "bg-white/10 text-white/60 border border-white/10"
                      }`}
                    >
                      Disponibilité : {candidate.availability}
                    </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="relative h-16 w-16">
                      <svg viewBox="0 0 64 64" className="h-16 w-16">
                        <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          stroke="#007BFF"
                          strokeWidth="6"
                          strokeLinecap="round"
                          fill="none"
                          strokeDasharray={2 * Math.PI * 26}
                          strokeDashoffset={(1 - candidate.match / 100) * 2 * Math.PI * 26}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[14px] font-bold">
                        {candidate.match}%
                      </span>
                    </div>
                    <div className="h-[120px] w-[180px] rounded-[14px] border border-white/10 bg-[#0B0B0B] p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={candidate.offerRadar}>
                          <PolarGrid stroke="rgba(255,255,255,0.08)" />
                          <PolarAngleAxis dataKey="axis" tick={false} />
                          <PolarRadiusAxis domain={[0, 100]} tick={false} />
                          <Radar dataKey="value" stroke="#007BFF" fill="rgba(0,123,255,0.15)" />
                          <Radar dataKey="value" stroke="#007BFF" fill="rgba(0,123,255,0.15)" />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <div className="text-[12px] font-semibold text-white">Analyse Prédictive</div>
                    <p className="mt-2 text-[12px] text-white/70">{candidate.analysis}</p>
                    <div className="mt-3 space-y-2">
                      {candidate.softSkills.map((skill) => (
                        <div key={skill.label}>
                          <div className="flex items-center justify-between text-[11px] text-white/60">
                            <span>{skill.label}</span>
                            <span className="text-[#007BFF]">{skill.value}%</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
                            <div
                              className="h-1.5 rounded-full bg-[#007BFF]"
                              style={{ width: `${skill.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`/dashboard/entreprise/offres/${offerId}/candidats/${candidate.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="mt-3 inline-flex text-[11px] font-semibold text-white/60 hover:text-white"
                    >
                      Voir le profil complet →
                    </Link>
                  </div>
                </div>
              </button>
            ))}
          </section>
        </div>
      </main>

      <Dialog open={!!selected} onOpenChange={(open) => setSelected(open ? selected : null)}>
        <DialogContent className="max-w-4xl border border-white/10 bg-[#050505] text-white">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name} · Détails de Matching</DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                  <div className="text-[13px] font-semibold">Axes IDMC (MAI)</div>
                  <div className="mt-3 space-y-2 text-[12px] text-white/70">
                    {selected.idmcAxes.map((axis) => (
                      <div key={axis.axis} className="flex items-center justify-between">
                        <span>{axis.axis}</span>
                        <span className="text-[#007BFF]">{axis.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-[18px] border border-white/10 bg-white/5 p-4">
                  <div className="text-[13px] font-semibold">Test comportemental</div>
                  <div className="mt-3 text-[12px] text-white/70">
                    Profil {selected.disc}. Leviers de motivation orientés vers la performance et la clarté des objectifs.
                  </div>
                  <div className="mt-4 text-[13px] font-semibold">Soft Skills clés</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selected.softSkills.map((skill) => (
                      <span
                        key={skill.label}
                        className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70"
                      >
                        {skill.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-full bg-[#007BFF] px-4 py-2 text-[12px] font-semibold text-black">
                  Planifier un entretien
                </button>
                <button className="rounded-full border border-white/10 px-4 py-2 text-[12px] text-white/70">
                  Ajouter au vivier
                </button>
                <button className="rounded-full border border-white/10 px-4 py-2 text-[12px] text-white/70">
                  Refuser
                </button>
                <button className="rounded-full bg-[#007BFF] px-4 py-2 text-[12px] font-semibold text-black">
                  Générer la fiche de synthèse pour le manager
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
