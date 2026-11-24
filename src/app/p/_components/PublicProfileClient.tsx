"use client";

import React from "react";
import { Building2 } from "lucide-react";
import { AxisKey, IdmcRadarChart } from "@/components/idmc/IdmcRadarChart";

type DiscScores = { D: number; I: number; S: number; C: number };
type ExperiencePro = {
  id?: string;
  learner_id?: string;
  employeur?: string | null;
  type_contrat?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  missions?: string | null;
};
type Diplome = {
  id?: string;
  learner_id?: string;
  intitule?: string | null;
  ecole?: string | null;
  annee_obtention?: number | null;
  mode?: string | null;
};

type PublicProfileClientProps = {
  profile: Record<string, unknown> | null;
  discScores: DiscScores | null;
  idmcAxes: Record<AxisKey, number> | null;
  idmcData: { global_score?: number | null; level?: string | null } | null;
  softSkillsTop: Array<{ skill: string; score: number }>;
  experiences: ExperiencePro[];
  diplomes: Diplome[];
};

const DISC_LABELS: Record<keyof DiscScores, string> = {
  D: "Dominance",
  I: "Influence",
  S: "Stabilité",
  C: "Conformité",
};

const DISC_COLORS: Record<keyof DiscScores, string> = {
  D: "#EF4444",
  I: "#F59E0B",
  S: "#10B981",
  C: "#3B82F6",
};

const DiscHistogram = ({ scores }: { scores: DiscScores }) => {
  const maxScore = Math.max(scores.D, scores.I, scores.S, scores.C, 1);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="text-[12px] text-white/60">Profil comportemental (DISC)</div>
      <div className="mt-4 flex h-36 items-end gap-4">
        {(Object.keys(scores) as Array<keyof DiscScores>).map((key) => {
          const height = Math.round((scores[key] / maxScore) * 130);
          return (
            <div key={key} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-md"
                style={{ height: `${height}px`, background: DISC_COLORS[key] }}
              />
              <div className="text-[11px] font-semibold text-white/70">
                {DISC_LABELS[key]}
              </div>
              <div className="text-[12px] font-semibold text-white">{scores[key]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const formatMonthYear = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric" }).format(date);
};

const formatRange = (start?: string | null, end?: string | null) => {
  const startLabel = formatMonthYear(start);
  const endLabel = end ? formatMonthYear(end) : "Présent";
  return `${startLabel} - ${endLabel}`;
};

export default function PublicProfileClient({
  profile,
  discScores,
  idmcAxes,
  idmcData,
  softSkillsTop,
  experiences,
  diplomes,
}: PublicProfileClientProps) {
  const firstName = String(profile?.first_name ?? "").trim();
  const lastName = String(profile?.last_name ?? "").trim();
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Profil Beyond";
  const softSkillsMax = Math.max(...softSkillsTop.map((item) => item.score), 1);

  return (
    <div className="min-h-screen bg-[#0B0D12] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-3">
          <div className="text-[12px] uppercase tracking-[0.3em] text-white/50">
            Profil public
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">{fullName}</h1>
          <p className="text-sm text-white/60">
            Profil partagé Beyond · Résultats DISC, IDMC et Soft Skills.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {discScores ? <DiscHistogram scores={discScores} /> : null}
          {idmcAxes ? (
            <IdmcRadarChart scores={idmcAxes} title="Radar IDMC" />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
              Aucun score IDMC disponible.
            </div>
          )}
        </div>

        {idmcData?.global_score || idmcData?.level ? (
          <div className="mt-4 text-sm text-white/70">
            Score global : {idmcData?.global_score ?? "--"}% · Niveau : {idmcData?.level ?? "--"}
          </div>
        ) : null}

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="text-[12px] uppercase tracking-[0.3em] text-white/50">
            Top 5 Soft Skills
          </div>
          {softSkillsTop.length === 0 ? (
            <div className="mt-4 text-sm text-white/60">Aucun score disponible.</div>
          ) : (
            <div className="mt-4 space-y-4">
              {softSkillsTop.map((item) => (
                <div key={item.skill} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-white/80">
                    <span>{item.skill}</span>
                    <span className="text-white">{item.score}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-[#F59E0B]"
                      style={{ width: `${(item.score / softSkillsMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="text-xs uppercase tracking-[0.3em] text-white/50">
              Diplômes & formations
            </div>
            {diplomes.length === 0 ? (
              <div className="mt-4 text-sm text-white/60">Aucun diplôme renseigné.</div>
            ) : (
              <div className="mt-5 space-y-5 border-l border-white/10 pl-6">
                {diplomes.map((dip) => (
                  <div key={dip.id ?? `${dip.intitule}-${dip.ecole}`} className="relative">
                    <div className="absolute -left-[9px] top-2 h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                    <div className="text-sm font-semibold text-white">
                      {dip.intitule || "Diplôme"}
                    </div>
                    <div className="mt-1 text-xs text-white/60">
                      {dip.ecole || "École"} · {dip.annee_obtention ?? "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="text-xs uppercase tracking-[0.3em] text-white/50">
              Parcours professionnel
            </div>
            {experiences.length === 0 ? (
              <div className="mt-4 text-sm text-white/60">
                Aucune expérience professionnelle renseignée.
              </div>
            ) : (
              <div className="mt-5 space-y-6 border-l border-white/10 pl-6">
                {experiences.map((exp) => {
                  const missions = String(exp.missions ?? "")
                    .split("\n")
                    .map((item) => item.trim())
                    .filter(Boolean);
                  return (
                    <div
                      key={exp.id ?? `${exp.employeur}-${exp.date_debut}`}
                      className="relative"
                    >
                      <div className="absolute -left-[34px] top-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/80">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="text-sm font-semibold text-white">
                          {exp.employeur || "Entreprise"}
                        </div>
                        <div className="mt-1 text-xs text-white/60">
                          {exp.type_contrat || "Contrat"} ·{" "}
                          {formatRange(exp.date_debut, exp.date_fin)}
                        </div>
                        {missions.length ? (
                          <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-white/70">
                            {missions.map((mission, index) => (
                              <li key={`${exp.id}-mission-${index}`}>{mission}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
