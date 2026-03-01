"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
// icons used for verified badge

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
  softSkills: Array<{ label: string; level: string }>;
  idmcAxes: Array<{ axis: string; value: number }>;
  discScores: { D: number; I: number; S: number; C: number };
  experiences: Array<{ role: string; company: string; duration: string }>;
  diplomas: Array<{ title: string; school: string; duration: string }>;
  languages: string[];
  certifications: string[];
  achievements: Record<string, string[]>;
  badges: Array<{
    title: string;
    issuer: string;
    date: string;
    skills: string[];
    image: string;
  }>;
};

const CANDIDATES: Candidate[] = [
  {
    id: "c-01",
    name: "Marc Lefebvre",
    availability: "Disponible immédiatement",
    mobility: "Mobile Normandie",
    lastCompany: "Agence Northwave",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    match: 96,
    idmc: 92,
    disc: "Dominant",
    softSkills: [
      { label: "Leadership", level: "88%" },
      { label: "Organisation", level: "84%" },
      { label: "Résilience", level: "82%" },
    ],
    idmcAxes: [
      { axis: "Connaissance de soi", value: 84 },
      { axis: "Maîtrise des méthodes", value: 88 },
      { axis: "Adaptation au contexte", value: 90 },
      { axis: "Organisation", value: 86 },
      { axis: "Traitement de l'info", value: 80 },
      { axis: "Résolution de problèmes", value: 92 },
      { axis: "Suivi", value: 78 },
      { axis: "Auto-évaluation", value: 84 },
    ],
    discScores: { D: 78, I: 62, S: 55, C: 48 },
    experiences: [
      { role: "Chef de Projet Junior", company: "Agence Northwave", duration: "3 ans" },
      { role: "Coordinateur CRM", company: "Mediapulse", duration: "2 ans" },
    ],
    diplomas: [{ title: "Master Management Digital", school: "École Y", duration: "2 ans" }],
    languages: ["Français (C2)", "Anglais (C1)"],
    certifications: ["Gestion agile", "Analytics avancé"],
    achievements: {
      "Agence Northwave": [
        "Pilotage de 6 projets digitaux simultanés",
        "Amélioration du time-to-market de 18%",
        "Coordination de 4 équipes transverses",
      ],
      Mediapulse: ["Refonte du CRM interne", "Automatisation du reporting hebdo"],
    },
    badges: [
      {
        title: "Fondamentaux du Prompt Engineering",
        issuer: "Beyond Academy",
        date: "2024-04-12",
        skills: ["Prompting", "Structuration", "Analyse"],
        image:
          "https://images.unsplash.com/photo-1529429617124-a2e0b9d3b3c2?auto=format&fit=crop&w=600&q=80",
      },
      {
        title: "Analyse de Données Stratégique",
        issuer: "Talenz",
        date: "2023-11-02",
        skills: ["Data", "Visualisation", "Décision"],
        image:
          "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=600&q=80",
      },
      {
        title: "Management de la Complexité",
        issuer: "Institut MAI",
        date: "2023-06-18",
        skills: ["Leadership", "Priorisation", "Systémie"],
        image:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: "c-02",
    name: "Léa Vasseur",
    availability: "En recherche active",
    mobility: "Mobile Caen & Paris",
    lastCompany: "Studio Axis",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
    match: 89,
    idmc: 78,
    disc: "Collaboratif",
    softSkills: [
      { label: "Collaboration", level: "86%" },
      { label: "Communication", level: "80%" },
      { label: "Empathie", level: "78%" },
    ],
    idmcAxes: [
      { axis: "Connaissance de soi", value: 74 },
      { axis: "Maîtrise des méthodes", value: 76 },
      { axis: "Adaptation au contexte", value: 80 },
      { axis: "Organisation", value: 72 },
      { axis: "Traitement de l'info", value: 70 },
      { axis: "Résolution de problèmes", value: 76 },
      { axis: "Suivi", value: 68 },
      { axis: "Auto-évaluation", value: 72 },
    ],
    discScores: { D: 52, I: 74, S: 70, C: 58 },
    experiences: [
      { role: "Chargée de projet RH", company: "Studio Axis", duration: "14 mois" },
      { role: "Assistante RH", company: "Viva Consulting", duration: "10 mois" },
    ],
    diplomas: [{ title: "Licence RH & Organisation", school: "Université Y", duration: "2 ans" }],
    languages: ["Français (C2)", "Anglais (B2)"],
    certifications: ["Communication d'équipe", "Conduite du changement"],
    achievements: {
      "Studio Axis": [
        "Mise en place d'un onboarding structuré",
        "Suivi des indicateurs RH mensuels",
      ],
      "Viva Consulting": ["Animation des rituels d'équipe", "Gestion des dossiers alternants"],
    },
    badges: [
      {
        title: "Communication d'Équipe",
        issuer: "Beyond Academy",
        date: "2024-01-08",
        skills: ["Collaboration", "Feedback", "Alignement"],
        image:
          "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
      },
      {
        title: "RH & Organisation",
        issuer: "Talenz",
        date: "2023-09-19",
        skills: ["Process", "Conformité", "Reporting"],
        image:
          "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: "c-03",
    name: "Thomas Roux",
    availability: "À l'écoute d'opportunités",
    mobility: "Mobile Rouen",
    lastCompany: "DataNova",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    match: 84,
    idmc: 72,
    disc: "Technique",
    softSkills: [
      { label: "Rigueur", level: "84%" },
      { label: "Analyse", level: "80%" },
      { label: "Fiabilité", level: "76%" },
    ],
    idmcAxes: [
      { axis: "Connaissance de soi", value: 68 },
      { axis: "Maîtrise des méthodes", value: 74 },
      { axis: "Adaptation au contexte", value: 66 },
      { axis: "Organisation", value: 72 },
      { axis: "Traitement de l'info", value: 70 },
      { axis: "Résolution de problèmes", value: 68 },
      { axis: "Suivi", value: 62 },
      { axis: "Auto-évaluation", value: 64 },
    ],
    discScores: { D: 60, I: 48, S: 66, C: 78 },
    experiences: [
      { role: "Analyste Data", company: "DataNova", duration: "2 ans" },
      { role: "Technicien BI", company: "Orion Labs", duration: "10 mois" },
    ],
    diplomas: [{ title: "Master Data & IA", school: "École X", duration: "2 ans" }],
    languages: ["Français (C2)", "Anglais (B2)"],
    certifications: ["DataOps", "SQL avancé"],
    achievements: {
      DataNova: ["Optimisation des pipelines de données", "Fiabilisation de 12 tableaux de bord"],
      "Orion Labs": ["Industrialisation des requêtes SQL", "Support BI avancé"],
    },
    badges: [
      {
        title: "DataOps Avancé",
        issuer: "Institut MAI",
        date: "2024-02-12",
        skills: ["DataOps", "Monitoring", "Fiabilité"],
        image:
          "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
      },
      {
        title: "SQL Excellence",
        issuer: "Beyond Academy",
        date: "2023-07-29",
        skills: ["SQL", "Optimisation", "Architecture"],
        image:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
];

const trainingCards = [
  {
    title: "Prompt Engineering",
    subtitle: "Réseaux neuronaux néon",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "SEO Avancé & Data",
    subtitle: "Graphiques de croissance 3D",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Leadership Hybride",
    subtitle: "Collaboration à distance",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Agilité Émotionnelle",
    subtitle: "Formes organiques abstraites",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
  },
];

export default function CandidatProfilPage() {
  const params = useParams();
  const candidateId = Array.isArray(params.candidateId) ? params.candidateId[0] : params.candidateId;
  const candidate = useMemo(() => CANDIDATES.find((item) => item.id === candidateId), [candidateId]);

  if (!candidate) {
    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <EnterpriseSidebar />
        <main className="min-h-screen px-8 py-10 pl-[260px]">
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-6">
            Candidat introuvable.
          </div>
        </main>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <EnterpriseSidebar />
      <main className="min-h-screen px-8 py-10 pl-[260px]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-4 text-[12px] text-white/60">
            <a href={`/dashboard/entreprise/offres/${params.id}/candidats`} className="hover:text-white">
              ← Retour aux candidats
            </a>
          </div>

          <div className="sticky top-0 z-20 rounded-[24px] border border-white/10 bg-[#050505]/90 p-4 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={candidate.avatar}
                  alt={candidate.name}
                  className="h-16 w-16 rounded-full border border-white/10 object-cover"
                />
                <div>
                  <div className="text-[18px] font-extrabold">{candidate.name}</div>
                  <div className="mt-1 inline-flex rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/70">
                    {candidate.availability}
                  </div>
                  <div className="mt-1 text-[11px] text-white/60">{candidate.mobility}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-full bg-[#007BFF] px-4 py-2 text-[12px] font-semibold text-black">
                  Planifier un entretien
                </button>
                <button className="rounded-full border border-[#007BFF]/50 px-4 py-2 text-[12px] text-[#7FB7FF]">
                  Ajouter au vivier
                </button>
                <button className="rounded-full border border-white/10 px-4 py-2 text-[12px] text-white/60">
                  Refuser
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
            <section className="rounded-[24px] border border-white/10 bg-white/5 p-6">
              <div className="text-[13px] font-semibold">Test comportemental</div>
              <div className="mt-4 grid grid-cols-4 gap-3 text-[10px]">
                {[
                  { key: "D", label: "Décisionnel", value: candidate.discScores.D },
                  { key: "I", label: "Relationnel", value: candidate.discScores.I },
                  { key: "S", label: "Stable", value: candidate.discScores.S },
                  { key: "C", label: "Conforme", value: candidate.discScores.C },
                ].map((item) => (
                  <div key={item.key} className="flex flex-col items-center">
                    <div className="relative flex h-[140px] w-full items-end justify-center rounded-[14px] border border-white/10 bg-[#0B0B0B] px-2 py-3">
                      <div
                        className="w-full rounded-[10px] bg-gradient-to-t from-[#0057CC] via-[#007BFF] to-[#7FB7FF]"
                        style={{ height: `${Math.max(10, item.value)}%` }}
                      />
                      <div className="absolute top-2 text-[11px] font-semibold text-[#7FB7FF]">{item.value}</div>
                    </div>
                    <div className="mt-2 text-[11px] font-semibold text-white">{item.key}</div>
                    <div className="text-[9px] text-white/50">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[18px] border-2 border-[#007BFF]/50 bg-white/5 p-4 shadow-[0_0_18px_rgba(0,123,255,0.35)] backdrop-blur-md">
                <div className="text-[13px] font-semibold text-white">Compétences Certifiées & Badges</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {candidate.badges.map((badge) => (
                    <div
                      key={badge.title}
                      className="group rounded-[16px] border border-white/10 bg-[#0B0B0B] p-3 transition-transform duration-200 hover:scale-105 hover:shadow-[0_0_16px_rgba(0,123,255,0.45)]"
                      title={`${badge.title}\nÉmis par ${badge.issuer}\nDate: ${badge.date}\nCompétences: ${badge.skills.join(
                        ", ",
                      )}`}
                    >
                      <div className="relative h-[90px] w-full overflow-hidden rounded-[12px] border border-white/10">
                        <img src={badge.image} alt={badge.title} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      </div>
                      <div className="mt-3 text-[12px] font-semibold text-white">{badge.title}</div>
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#007BFF]/30 bg-[#007BFF]/10 px-2 py-0.5 text-[10px] text-[#7FB7FF]">
                        <Check className="h-3 w-3" />
                        Verified
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-white/10 bg-white/5 p-6">
              <div className="text-[14px] font-semibold">Potentiel d&apos;Apprentissage & Adaptabilité</div>
              <div className="mt-4 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={candidate.idmcAxes}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 9 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} />
                    <Radar dataKey="value" stroke="#007BFF" fill="rgba(0,123,255,0.25)" />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[14px] font-semibold">Synthèse de l&apos;expert</div>
              <div className="mt-3 text-[12px] text-white/70 leading-relaxed">
                Ce candidat possède un profil à fort potentiel de montée en compétences. Son parcours chez{" "}
                {candidate.lastCompany} combiné à son IDMC ({candidate.idmc}) garantit une autonomie d&apos;apprentissage
                rapide et une adaptation solide aux missions clés du poste. Son style Test comportemental ({candidate.disc}) assure une
                intégration fluide dans l&apos;équipe et une contribution durable à la performance collective.
              </div>
              <div className="mt-6 space-y-4">
                <div className="text-[13px] font-semibold">Expériences Professionnelles</div>
                <div className="space-y-3">
                  {candidate.experiences.map((exp) => (
                    <div key={`${exp.company}-${exp.role}`} className="rounded-[14px] border border-white/10 bg-[#0B0B0B] p-4">
                      <div className="text-[13px] font-semibold text-white">
                        {exp.company} — {exp.role}
                      </div>
                      <div className="text-[11px] text-white/60">{exp.duration}</div>
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-white/70">
                        {(candidate.achievements[exp.company] || []).map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[13px] font-semibold">Formation & Diplômes</div>
                  <div className="mt-2 space-y-2">
                    {candidate.diplomas.map((diploma) => (
                      <div
                        key={diploma.title}
                        className="rounded-[12px] border border-white/10 bg-[#0B0B0B] px-3 py-2 text-[12px] text-white/70"
                      >
                        {diploma.title} — {diploma.school} ({diploma.duration})
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="mt-6 text-[13px] font-semibold">Soft Skills validées</div>
              <div className="mt-3 space-y-2">
                {candidate.softSkills.map((skill) => {
                  const value = Number(skill.level.replace("%", ""));
                  return (
                    <div key={skill.label}>
                      <div className="flex items-center justify-between text-[12px] text-white/70">
                        <span>{skill.label}</span>
                        <span className="text-[#007BFF]">{skill.level}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
                        <div className="h-1.5 rounded-full bg-[#007BFF]" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <section className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div className="text-[16px] font-extrabold">Formations recommandées pour son intégration</div>
              <button className="text-[12px] text-[#007BFF]">Voir plus</button>
            </div>
            <div className="mt-5 flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
              {trainingCards.map((card) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="group relative min-h-[260px] min-w-[210px] snap-start overflow-hidden rounded-[24px] border border-white/10 bg-white/5 shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
                >
                  <img src={card.image} alt={card.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="text-[14px] font-bold text-white">{card.title}</div>
                    <div className="mt-1 text-[11px] text-white/70">{card.subtitle}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
}
