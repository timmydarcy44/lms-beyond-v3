"use client";

import { motion } from "framer-motion";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { enterpriseEmployees } from "@/lib/mocks/enterpriseEmployees";

const stats = [
  { label: "Apprenants actifs", value: "42", detail: "+6 ce mois" },
  { label: "Profils complets", value: "18", detail: "43% complétés" },
  { label: "Offres ouvertes", value: "7", detail: "2 urgentes" },
  { label: "Alerte Stress/Care", value: "—", detail: "Suivi prioritaire" },
];

const oracleProfiles = [
  {
    name: "Profil #A-27",
    score: 92,
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    summary:
      "Stabilité émotionnelle élevée, adaptabilité forte.\nCompatible avec environnement exigeant.\nRisque d’attrition faible.",
  },
  {
    name: "Profil #B-11",
    score: 88,
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
    summary:
      "Leadership émergent, énergie commerciale.\nProgression rapide sur soft skills clés.\nBesoin de mentorat léger.",
  },
  {
    name: "Profil #C-05",
    score: 85,
    avatar:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
    summary:
      "Esprit analytique + rigueur process.\nCommunication claire, faible stress.\nIdéal pour équipes structuréess.",
  },
];

const radarData = [
  { skill: "Leadership", entreprise: 72, national: 60 },
  { skill: "Communication", entreprise: 81, national: 68 },
  { skill: "Adaptabilité", entreprise: 75, national: 70 },
  { skill: "Esprit Critique", entreprise: 69, national: 58 },
  { skill: "Collaboration", entreprise: 84, national: 73 },
  { skill: "Résilience", entreprise: 78, national: 64 },
];

export default function EnterpriseDashboardPage() {
  const ruptureAlerts = enterpriseEmployees.filter((employee) => {
    const lastStress = employee.stressWeekly.slice(-3);
    const lastEngagement = employee.engagementWeekly.slice(-3);
    return (
      lastStress.length === 3 &&
      lastEngagement.length === 3 &&
      lastStress.every((value) => value > 80) &&
      lastEngagement.every((value) => value < 40)
    );
  });

  const statsWithAlerts = stats.map((stat) =>
    stat.label === "Alerte Stress/Care" ? { ...stat, value: String(ruptureAlerts.length) } : stat,
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <EnterpriseSidebar />
      <main className="min-h-screen px-8 py-10 pl-[260px]">
        <motion.div
          key="enterprise-dashboard"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-8"
        >
          <header>
            <h1 className="text-[28px] font-extrabold tracking-[-0.5px]">Dashboard Entreprise</h1>
            <p className="mt-1 text-[13px] text-white/60">
              Pilotage temps réel · Matching intelligent · Indicateurs RH
            </p>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {statsWithAlerts.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[20px] border border-blue-500/20 bg-white/5 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.4)]"
              >
                <div className="text-[12px] text-white/60">{stat.label}</div>
                <div className="mt-3 text-[28px] font-extrabold text-white">{stat.value}</div>
                <div className="mt-1 text-[12px] text-blue-300/80">{stat.detail}</div>
              </div>
            ))}
            <div className="rounded-[20px] border border-blue-500/20 bg-white/5 p-5 shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
              <div className="text-[12px] text-white/60">Indice de Rétention Prévisionnel</div>
              <div className="mt-4 flex items-center gap-4">
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
                      strokeDashoffset={(1 - 0.92) * 2 * Math.PI * 26}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[14px] font-bold">92%</span>
                </div>
                <div className="text-[12px] text-white/60">
                  Calculé via les signaux faibles de l’indice Care et l’autonomie IDMC.
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[24px] border border-blue-500/20 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[16px] font-extrabold">L’Oracle : Top Matching</div>
                  <div className="text-[12px] text-white/60">
                    3 profils les plus compatibles pour vos offres.
                  </div>
                </div>
                <button className="rounded-full bg-[#007BFF] px-4 py-2 text-[12px] font-semibold text-black">
                  Voir tous les profils
                </button>
              </div>
              <div className="mt-6 space-y-4">
                {oracleProfiles.map((profile) => (
                  <div
                    key={profile.name}
                    className="flex items-center gap-4 rounded-[18px] border border-blue-500/10 bg-[#0B0B0B]/60 p-4"
                  >
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-white">{profile.name}</div>
                      <p className="mt-1 whitespace-pre-line text-[12px] italic text-white/60">
                        {profile.summary}
                      </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="relative h-12 w-12">
                        <svg viewBox="0 0 48 48" className="h-12 w-12">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="4"
                            fill="none"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="#007BFF"
                            strokeWidth="4"
                            strokeLinecap="round"
                            fill="none"
                            strokeDasharray={2 * Math.PI * 20}
                            strokeDashoffset={(1 - profile.score / 100) * 2 * Math.PI * 20}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold">
                          {profile.score}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-blue-500/20 bg-white/5 p-6">
              <div className="text-[16px] font-extrabold">Radar Comparatif</div>
              <div className="text-[12px] text-white/60">Entreprise vs moyenne Beyond</div>
              <div className="mt-5 h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} />
                    <Radar
                      dataKey="entreprise"
                      stroke="#007BFF"
                      fill="rgba(0,123,255,0.25)"
                      strokeWidth={2}
                      className="drop-shadow-[0_0_12px_rgba(0,123,255,0.7)]"
                    />
                    <Radar
                      dataKey="national"
                      stroke="rgba(255,255,255,0.6)"
                      fill="transparent"
                      strokeDasharray="4 4"
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-[12px] text-white/60">
                Bleu : moyenne entreprise · Blanc : moyenne nationale Beyond
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-blue-500/20 bg-white/5 p-6">
            <div className="text-[16px] font-extrabold">Recommandations Proactives</div>
            <p className="mt-1 text-[12px] text-white/60">
              Suggestions issues des scores de matching et signaux faibles.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {[
                "Haut potentiel d'agilité : Capacité d'apprentissage supérieure de +15% vs secteur.",
                "Alerte Management : Baisse de l'auto-évaluation, besoin d'un point de suivi.",
                "Risque : 2 profils en stress élevé, engagement en baisse continue.",
              ].map((text, index) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.35 }}
                  className="rounded-[18px] border border-blue-500/30 bg-[#0B0B0B] p-4 text-[13px] text-white/80 transition hover:scale-[1.02]"
                >
                  {text}
                </motion.div>
              ))}
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
}
