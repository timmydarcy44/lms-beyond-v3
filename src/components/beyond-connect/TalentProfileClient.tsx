"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { Mail, Linkedin, Phone } from "lucide-react";

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

type TalentProfileClientProps = {
  talent: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
    email?: string | null;
    phone?: string | null;
    linkedin_url?: string | null;
    bio?: string | null;
    city?: string | null;
    open_badges?: Array<string | { name?: string; image_url?: string; url?: string }> | null;
    soft_skills_scores?: {
      dimensions?: Record<string, number | { score10?: number; average?: number }>;
    } | null;
  };
};

export default function TalentProfileClient({ talent }: TalentProfileClientProps) {
  const rawDimensions = talent.soft_skills_scores?.dimensions || {};
  const softSkills = Object.fromEntries(
    Object.entries(rawDimensions).map(([key, value]) => {
      if (typeof value === "number") return [key, value];
      const numeric = value?.score10 ?? (value?.average ? value.average * 2 : 0);
      return [key, typeof numeric === "number" ? numeric : 0];
    })
  ) as Record<string, number>;
  const radarData = radarLabels.map((label) => ({
    skill: label,
    value: softSkills[label] || 0,
  }));
  const maxRadar = Math.max(10, ...radarData.map((item) => item.value || 0));
  const topFive = [...radarData].sort((a, b) => b.value - a.value).slice(0, 5);
  const topTwo = [...radarData].sort((a, b) => b.value - a.value).slice(0, 2);
  const bottomTwo = [...radarData].sort((a, b) => a.value - b.value).slice(0, 2);
  const openBadges = Array.isArray(talent.open_badges) ? talent.open_badges : [];

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-[#050A18]">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="grid gap-10 lg:grid-cols-[0.35fr_0.65fr]">
          <aside className="space-y-6">
            <div className="h-36 w-36 overflow-hidden rounded-full border border-slate-200 bg-white">
              {talent.avatar_url ? (
                <img src={talent.avatar_url} alt={talent.first_name || "Talent"} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm">Profil</div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-semibold">
                {(talent.first_name || "").trim()} {(talent.last_name || "").trim()}
              </h1>
              <p className="mt-2 text-sm text-[#050A18]/60">{talent.city || "France"}</p>
            </div>
            <div className="flex flex-col gap-3 text-[#050A18]/80">
              {talent.email && (
                <a
                  href={`mailto:${talent.email}`}
                  className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-semibold tracking-tight text-[#050A18] shadow-sm"
                >
                  <Mail className="h-4 w-4" />
                  {talent.email}
                </a>
              )}
              {talent.phone && (
                <a
                  href={`tel:${talent.phone}`}
                  className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-semibold tracking-tight text-[#050A18] shadow-sm"
                >
                  <Phone className="h-4 w-4" />
                  {talent.phone}
                </a>
              )}
              {talent.linkedin_url && (
                <a
                  href={talent.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-semibold tracking-tight text-[#050A18] shadow-sm"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
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
          </aside>
          <section className="space-y-6">
            <div className="h-96 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <ResponsiveContainer width="100%" height="100%">
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
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-[#050A18]/70 shadow-sm">
              <p className="text-xs tracking-tight text-[#050A18]/50">Open badges</p>
              {openBadges.length === 0 ? (
                <p className="mt-3 text-sm text-[#050A18]/40">Aucun open badge</p>
              ) : (
                <div className="mt-4 grid grid-cols-3 gap-3">
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
          </section>
        </div>
      </div>
    </main>
  );
}
