"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { X, Mail, Linkedin, Phone } from "lucide-react";

type TalentModalProps = {
  open: boolean;
  onClose: () => void;
  talent: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    linkedin?: string;
    avatar?: string;
    mobilityScore?: number;
    softSkills?: Record<string, number>;
    hardSkills?: string[];
    openBadges?: Array<string | { name?: string; image_url?: string; url?: string }>;
    isCompany?: boolean;
  } | null;
};

const radarLabels = [
  "Gestion des émotions",
  "Communication",
  "Persévérance",
  "Organisation",
  "Empathie",
  "Résolution de problèmes",
  "Collaboration",
  "Créativité",
  "Leadership",
  "Confiance en soi",
];

const defaultSoftSkills = radarLabels.reduce<Record<string, number>>((acc, label) => {
  acc[label] = 6;
  return acc;
}, {});

export function TalentModal({ open, onClose, talent }: TalentModalProps) {
  if (!open || !talent) return null;

  const softSkills = { ...defaultSoftSkills, ...(talent.softSkills || {}) };
  const radarData = radarLabels.map((label) => ({
    skill: label,
    value: softSkills[label] || 0,
  }));
  const maxRadar = Math.max(10, ...radarData.map((item) => item.value || 0));
  const topFive = [...radarData]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const topTwo = [...radarData].sort((a, b) => b.value - a.value).slice(0, 2);
  const bottomTwo = [...radarData].sort((a, b) => a.value - b.value).slice(0, 2);

  const mailSubject = encodeURIComponent("Beyond Connect - Nouvelle opportunité pour vous");
  const mailHref = talent.email ? `mailto:${talent.email}?subject=${mailSubject}` : `mailto:?subject=${mailSubject}`;
  const openBadges = Array.isArray(talent.openBadges) ? talent.openBadges : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6 backdrop-blur-xl">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-8 text-[#050A18] shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#050A18]">{talent.name}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#050A18]/70">
              {talent.email && (
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {talent.email}
                </span>
              )}
              {talent.phone && (
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {talent.phone}
                </span>
              )}
              {talent.linkedin && (
                <span className="inline-flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-[#050A18]/70 hover:text-[#050A18]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[0.35fr_0.65fr]">
          <div className="space-y-6">
            <div className="h-32 w-32 overflow-hidden rounded-full border border-slate-200 bg-white">
              {talent.avatar ? (
                <img src={talent.avatar} alt={talent.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm">Profil</div>
              )}
            </div>
            <div>
              <p className="text-xs tracking-tight text-[#050A18]/50">Score de mobilité</p>
              <p className="mt-1 text-3xl font-semibold text-[#050A18]">{talent.mobilityScore ?? 80}%</p>
            </div>
            <div className="rounded-2xl border border-[#007AFF]/50 bg-white p-5 shadow-sm">
              <p className="text-xs tracking-tight text-[#007AFF]">Top 5 atouts</p>
              <div className="mt-4 flex flex-col gap-2">
                {topFive.map((item) => (
                  <div
                    key={item.skill}
                    className="flex items-center justify-between rounded-xl border border-[#007AFF]/40 px-3 py-2 text-xs tracking-tight text-[#007AFF]"
                  >
                    <span>{item.skill}</span>
                    <span>{item.value}/10</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs tracking-tight text-[#050A18]/60">Open badges certifiés</p>
              {openBadges.length === 0 ? (
                <p className="mt-4 text-sm text-[#050A18]/40">Aucun open badge</p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {openBadges.map((badge, index) => {
                    const badgeName = typeof badge === "string" ? badge : badge.name || "Badge";
                    const badgeImage = typeof badge === "string" ? "" : badge.image_url || badge.url || "";
                    return (
                      <div
                        key={`${badgeName}-${index}`}
                        className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm"
                      >
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-[10px] tracking-tight text-[#050A18]/70">
                          {badgeImage ? (
                            <img src={badgeImage} alt={badgeName} className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            "B"
                          )}
                        </div>
                        <p className="mt-2 text-[10px] tracking-tight text-[#050A18]/60">
                          {badgeName}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-64 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(15,23,42,0.12)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "#0F172A", fontSize: 10 }} />
                  <PolarRadiusAxis
                    tick={{ fill: "#0F172A", fontSize: 10 }}
                    angle={30}
                    domain={[0, Math.ceil(maxRadar)]}
                  />
                  <Radar dataKey="value" stroke="#0F172A" fill="rgba(15,23,42,0.15)" />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-[#050A18]/80 shadow-sm">
                <p className="text-xs tracking-tight text-[#050A18]/50">Forces</p>
                <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-[#050A18]/70">
                  {topTwo.length > 0 ? (
                    topTwo.map((item) => <li key={item.skill}>{item.skill}</li>)
                  ) : (
                    <li>Potentiel élevé sur plusieurs dimensions.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-[#050A18]/80 shadow-sm">
                <p className="text-xs tracking-tight text-[#050A18]/50">Axes de développement</p>
                <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-[#050A18]/70">
                  {bottomTwo.length > 0 ? (
                    bottomTwo.map((item) => <li key={item.skill}>{item.skill}</li>)
                  ) : (
                    <li>Axes de progression à affiner selon le poste.</li>
                  )}
                </ul>
              </div>
            </div>
            <div>
              <p className="text-xs tracking-tight text-[#050A18]/50">Hard Skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(talent.hardSkills || ["Négociation", "CRM", "Reporting", "Prospection"]).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] tracking-tight text-[#050A18]/70 shadow-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={mailHref}
                className="inline-flex w-fit items-center gap-2 rounded-sm border border-slate-200 bg-white px-6 py-3 text-xs font-semibold tracking-tight text-[#050A18] shadow-sm"
              >
                <Mail className="h-4 w-4" />
                Contacter le talent
              </a>
              <a
                href={`/dashboard/entreprise/talents/${talent.id}`}
                className="inline-flex w-fit items-center gap-2 rounded-sm border border-[#007AFF]/60 px-6 py-3 text-xs font-semibold tracking-tight text-[#007AFF]"
              >
                Voir le profil complet
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
