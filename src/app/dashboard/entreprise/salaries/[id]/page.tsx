"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { enterpriseEmployees } from "@/lib/mocks/enterpriseEmployees";
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import TalentLog from "@/components/TalentLog";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import AfestModal from "@/components/AfestModal";
import BadgeSlider from "@/components/BadgeSlider";

const formatEuro = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);

export default function SalarieDetailPage() {
  const params = useParams();
  const employee = useMemo(
    () => enterpriseEmployees.find((item) => item.id === params.id),
    [params.id],
  );

  if (!employee) {
    return (
      <div className="min-h-screen bg-[#050505] text-white">
        <EnterpriseSidebar />
        <main className="min-h-screen px-8 py-10 pl-[260px]">
          <div className="rounded-[20px] border border-blue-500/20 bg-white/5 p-6">
            Salarié introuvable.
          </div>
        </main>
      </div>
    );
  }

  const radarData = [
    { skill: "Connaissance de soi", value: 72 },
    { skill: "Maîtrise des méthodes", value: 68 },
    { skill: "Adaptation au contexte", value: 70 },
    { skill: "Organisation", value: 74 },
    { skill: "Traitement de l'info", value: 66 },
    { skill: "Résolution de problèmes", value: 78 },
    { skill: "Suivi", value: 64 },
    { skill: "Auto-évaluation", value: 60 },
  ];

  const lineData = employee.idmcHistory;
  const idmcAverage =
    Math.round(radarData.reduce((sum, item) => sum + item.value, 0) / radarData.length) || 0;
  const dominantAxis = radarData.reduce((best, item) => (item.value > best.value ? item : best), radarData[0]);
  const discDominant = Object.entries(employee.disc).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "S";
  const renderRadarTooltip = (props: any) => {
    const { active, payload } = props as {
      active?: boolean;
      payload?: Array<{ payload: { skill: string; value: number } }>;
    };
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    const score = Math.round((data.value / 100) * 15);
    return (
      <div className="rounded-full border border-blue-500/40 bg-[#007BFF]/20 px-3 py-1 text-[11px] text-blue-100 shadow-[0_0_12px_rgba(0,123,255,0.6)]">
        {data.skill} : {score}/15
      </div>
    );
  };

  const iaPrompt =
    "Tu es un expert en psychologie et en psychologie comportementale. À l'aide des résultats des tests (IDMC: {idmc}, Test comportemental: {disc}, Soft Skills: {skills}), crée une présentation précise de {nom_prenom}. Analyse comment son style comportemental interagit avec son autonomie d'apprentissage (métacognition) pour définir son profil professionnel unique et ses leviers de motivation.";

  const [afestModalOpen, setAfestModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <EnterpriseSidebar />
      <main className="min-h-screen px-8 py-10 pl-[260px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[22px] font-extrabold">{employee.name}</div>
            <div className="text-[12px] text-white/60">{employee.role}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full border border-blue-500/40 px-4 py-2 text-[12px] text-blue-200">
              Exporter l&apos;Audit de Compétences
            </button>
            <button className="rounded-full bg-[#007BFF] px-4 py-2 text-[12px] font-semibold text-black">
              Générer Rapport de Sélection
            </button>
            <button
              onClick={() => setAfestModalOpen(true)}
              className="rounded-full border border-blue-500 px-4 py-2 text-[12px] font-semibold text-blue-200 shadow-[0_0_10px_rgba(0,123,255,0.5)]"
            >
              Faire une demande d&apos;AFEST
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr_1fr]">
          <section className="rounded-[24px] border border-white/5 bg-white/5 p-6">
            <img
              src={employee.avatar}
              alt={employee.name}
              className="h-24 w-24 rounded-full border border-blue-500/20 object-cover"
            />
            <div className="mt-4 text-[18px] font-bold">{employee.name}</div>
            <div className="text-[12px] text-white/60">{employee.role}</div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-4 rounded-[16px] border border-[#007BFF]/30 bg-[#0B0B0B] p-4 text-[12px] text-white/70"
            >
              <div className="text-[12px] font-semibold text-white">Synthèse Beyond IA</div>
              <div className="mt-2 space-y-3 text-[13px] leading-relaxed text-white/70">
                <p className="text-[14px] font-semibold text-white">
                  Un profil professionnel affirmé, aligné sur un style comportemental {discDominant}.
                </p>
                <p>
                  Les résultats indiquent une capacité d&apos;apprentissage élevée et une adaptabilité stable dans des
                  environnements complexes. Le score de {idmcAverage} confirme une autonomie d&apos;apprentissage
                  solide, particulièrement sur l&apos;axe {dominantAxis.skill}.
                </p>
                <p>
                  Ce profil se distingue par une posture méthodique et une progression continue, avec des leviers de
                  motivation liés aux missions de structuration et de résolution de problèmes.
                </p>
                <span className="block text-[11px] text-white/40">Prompt IA: {iaPrompt}</span>
              </div>
            </motion.div>
            <div
              className="mt-3 inline-flex items-center gap-2 text-[14px] text-white/80"
              title="Donnée à accès restreint (Admin RH uniquement) - Conforme RGPD."
            >
              Salaire annuel : <span className="text-white">{formatEuro(employee.salary)}</span>
              <Lock size={12} className="text-white/40" />
            </div>
            {employee.rqth && (
              <div
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-[12px] text-blue-200"
                title="Accès restreint - Donnée RH sensible"
              >
                <Lock size={12} />
                RQTH déclaré
              </div>
            )}
            <button className="mt-6 w-full rounded-full bg-[#007BFF] px-4 py-2 text-[13px] font-semibold text-black">
              Modifier le contrat
            </button>
          </section>

          <section className="rounded-[24px] border border-white/5 bg-white/5 p-6">
            <div
              className="text-[16px] font-extrabold"
              title="Mesure la métacognition : capacité du collaborateur à piloter son apprentissage, à s'auto-évaluer et à s'ajuster seul face à la complexité."
            >
              Potentiel d&apos;Apprentissage & Adaptabilité
            </div>
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} />
                  <Tooltip content={renderRadarTooltip} />
                  <Radar
                    dataKey="value"
                    stroke="#007BFF"
                    fill="rgba(0,123,255,0.25)"
                    strokeWidth={2}
                    activeDot={{ r: 4, fill: "#007BFF", stroke: "#FFFFFF", strokeWidth: 1 }}
                    dot={{ r: 2, fill: "#007BFF" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-white/60">
              <span className="rounded-full border border-white/10 px-3 py-1">Famille Analyse</span>
              <span className="rounded-full border border-white/10 px-3 py-1">Famille Pilotage</span>
            </div>
            <div className="mt-6">
              <div
                className="text-[14px] font-semibold"
                title="Mesure la métacognition : capacité du collaborateur à piloter son apprentissage, à s'auto-évaluer et à s'ajuster seul face à la complexité."
              >
                Oracle de Progression (Potentiel d&apos;Apprentissage & Adaptabilité)
              </div>
              <div className="mt-1 text-[12px] text-white/60">12 derniers mois</div>
              <div className="mt-3 h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 10 }} />
                    <YAxis domain={[40, 100]} tick={false} />
                    <Tooltip contentStyle={{ background: "#0B0B0B", border: "1px solid rgba(255,255,255,0.1)" }} />
                    <Line type="monotone" dataKey="score" stroke="#007BFF" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] text-blue-200">
                Progression : +12% vs Moyenne Secteur
              </div>
            </div>
            <div className="mt-6">
              <div className="text-[14px] font-semibold">Test comportemental</div>
              <div className="relative mt-4 h-[180px] rounded-[16px] border border-white/5 bg-[#0B0B0B]">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                  <div className="border-b border-r border-white/5" />
                  <div className="border-b border-white/5" />
                  <div className="border-r border-white/5" />
                  <div />
                </div>
                <div className="absolute left-3 top-2 text-[10px] text-white/50">D</div>
                <div className="absolute right-3 top-2 text-[10px] text-white/50">I</div>
                <div className="absolute left-3 bottom-2 text-[10px] text-white/50">S</div>
                <div className="absolute right-3 bottom-2 text-[10px] text-white/50">C</div>
                <div
                  className="absolute h-3 w-3 rounded-full bg-[#007BFF] shadow-[0_0_12px_rgba(0,123,255,0.8)]"
                  style={{
                    left: `${Math.min(95, Math.max(5, (employee.disc.I - employee.disc.C + 100) / 2))}%`,
                    top: `${Math.min(95, Math.max(5, (employee.disc.D - employee.disc.S + 100) / 2))}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-white/5 bg-white/5 p-6">
            <div className="text-[16px] font-extrabold">Suivi</div>
            <div className="mt-4">
              <div className="text-[12px] text-white/60">Mémoire Institutionnelle</div>
              <div className="mt-3">
                <TalentLog initialEntries={employee.observations} />
              </div>
            </div>
            <div className="mt-6">
              <div className="text-[12px] text-white/60">Entretiens Annuels</div>
              <div className="mt-3 space-y-3">
                {[
                  { date: "03/2024", label: "Compte-rendu PDF" },
                  { date: "03/2023", label: "Compte-rendu PDF" },
                ].map((item) => (
                  <div
                    key={item.date}
                    className="flex items-center justify-between rounded-[14px] border border-white/5 bg-[#0B0B0B] px-4 py-3 text-[12px]"
                  >
                    <span className="text-white/80">{item.date}</span>
                    <button className="rounded-full border border-blue-500/30 px-3 py-1 text-[11px] text-blue-200">
                      {item.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <BadgeSlider />
        <AfestModal
          open={afestModalOpen}
          onOpenChange={setAfestModalOpen}
          employee={{ name: employee.name, role: employee.role, contract: employee.contract }}
        />
      </main>
    </div>
  );
}
