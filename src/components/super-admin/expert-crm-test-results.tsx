"use client";

import { AXES_LABELS, IDMC_AXIS_KEYS, resolveIdmcAxisMasteryLevel } from "@/lib/idmc/idmc-display";
import type { EmployeeTestResults } from "@/lib/entreprise/employee-profile-diagnostics";
import { SectionCard, SectionHeader } from "@/components/super-admin/expert-fiche-ui";
import { Award, Brain, Sparkles, Target } from "lucide-react";

const DISC_LABELS: Record<"D" | "I" | "S" | "C", string> = {
  D: "Décisionnel",
  I: "Relationnel",
  S: "Stable",
  C: "Structuré",
};

function formatDay(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function ExpertCrmTestResults({ results }: { results: EmployeeTestResults }) {
  const disc = results.disc;
  const discEntries = disc
    ? (["D", "I", "S", "C"] as const)
        .map((key) => ({ key, score: Number(disc[key] ?? 0), label: DISC_LABELS[key] }))
        .sort((a, b) => b.score - a.score)
    : [];
  const axes = IDMC_AXIS_KEYS.map((key) => {
    const score = Math.round(Number(results.idmc_axes?.[key] ?? 0));
    return { key, label: AXES_LABELS[key], score, mastery: resolveIdmcAxisMasteryLevel(score) };
  }).sort((a, b) => b.score - a.score);
  const soft = [...results.soft_skills].sort((a, b) => b.score - a.score).slice(0, 8);
  const hasAny =
    Boolean(disc) ||
    Boolean(results.idmc_axes && Object.values(results.idmc_axes).some((v) => Number(v) > 0)) ||
    results.idmc_score != null ||
    soft.length > 0;

  if (!hasAny) {
    return (
      <SectionCard color="#9AA3BD">
        <SectionHeader
          icon={Brain}
          color="#9AA3BD"
          title="Bilans & tests"
          subtitle="Soft skills, DISC et IDMC passés depuis l’espace expert"
        />
        <p className="px-6 pb-6 pt-4 text-sm text-[#9AA3BD]">
          Aucun résultat pour l’instant. Dès qu’il passe les tests dans Mes bilans, ils apparaissent ici.
        </p>
      </SectionCard>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <SectionCard color="#8B7BFF">
        <SectionHeader
          icon={Target}
          color="#8B7BFF"
          title="DISC"
          subtitle={formatDay(results.disc_at) ? `Passé le ${formatDay(results.disc_at)}` : "Profil comportemental"}
        />
        <div className="space-y-3 px-6 pb-6 pt-4">
          {discEntries.length === 0 ? (
            <p className="text-sm text-[#9AA3BD]">Non passé</p>
          ) : (
            discEntries.map((item) => (
              <div key={item.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-extrabold text-white">
                    {item.key} · {item.label}
                  </span>
                  <span className="text-[#C9C2FF]">{Math.round(item.score)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#1A2340]">
                  <div
                    className="h-full rounded-full bg-[#8B7BFF]"
                    style={{ width: `${Math.max(4, Math.min(100, item.score))}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard color="#5EDCC3">
        <SectionHeader
          icon={Award}
          color="#5EDCC3"
          title="IDMC"
          subtitle={
            results.idmc_score != null
              ? `Score global ${Math.round(results.idmc_score)}${formatDay(results.idmc_at) ? ` · ${formatDay(results.idmc_at)}` : ""}`
              : formatDay(results.idmc_at)
                ? `Passé le ${formatDay(results.idmc_at)}`
                : "Motivations"
          }
        />
        <ul className="space-y-2 px-6 pb-6 pt-4">
          {axes.every((a) => a.score <= 0) ? (
            <li className="text-sm text-[#9AA3BD]">Non passé</li>
          ) : (
            axes.slice(0, 5).map((axis) => (
              <li key={axis.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold text-white">{axis.label}</span>
                <span className="shrink-0 text-[#5EDCC3]">
                  {axis.score} · {axis.mastery.replace(/^Maîtrise\s+/i, "")}
                </span>
              </li>
            ))
          )}
        </ul>
      </SectionCard>

      <SectionCard color="#F5C85C">
        <SectionHeader
          icon={Sparkles}
          color="#F5C85C"
          title="Soft skills"
          subtitle={
            formatDay(results.soft_skills_at)
              ? `Passé le ${formatDay(results.soft_skills_at)}`
              : "Compétences transverses"
          }
        />
        <ul className="space-y-2 px-6 pb-6 pt-4">
          {soft.length === 0 ? (
            <li className="text-sm text-[#9AA3BD]">Non passé</li>
          ) : (
            soft.map((item) => (
              <li key={item.skill} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold text-white">{item.skill}</span>
                <span className="shrink-0 text-[#F5C85C]">{Math.round(item.score)}/15</span>
              </li>
            ))
          )}
        </ul>
      </SectionCard>
    </div>
  );
}
