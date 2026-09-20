"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { EdgePageAmbiance } from "@/components/apprenant/edge-page-ambiance";
import {
  SkillsEmptyHint,
  SkillsProgressBar,
  SkillsSectionKicker,
} from "@/components/apprenant/skills/skills-ui";
import { useEdgeSkillsCenter } from "@/hooks/use-edge-skills-center";
import {
  decodeSkillParam,
  encodeSkillParam,
  levelProgressPercent,
  nextHardSkillLevel,
} from "@/lib/apprenant/edge-skills-center";
import {
  APPRENANT_PAGE_SHELL,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";
import {
  masteryBarFilled,
  resolveSkillUxStatus,
  SKILL_UX_STATUS,
} from "@/lib/hard-skills/hard-skills-portfolio";

const VALIDATION_SOURCES = [
  "Test EDGE",
  "Formation",
  "Simulation",
  "Preuve déposée",
  "Validation formateur",
  "Validation manager",
  "Certification",
];

export default function SkillsSkillDetailPage() {
  const params = useParams();
  const raw = typeof params.skill === "string" ? params.skill : "";
  const skillName = decodeSkillParam(raw);
  const { loading, records, meta } = useEdgeSkillsCenter();

  const record = useMemo(
    () => records.find((r) => r.name.toLowerCase() === skillName.toLowerCase()) ?? null,
    [records, skillName],
  );
  const m = record ? meta[record.name] : undefined;
  const status = resolveSkillUxStatus(m);
  const statusUi = SKILL_UX_STATUS[status];
  const target = m?.trainingTargetLevel ?? (record ? nextHardSkillLevel(record.level) : "Confirmé");
  const progress = record ? levelProgressPercent(record.level, target) : 0;
  const proofCount = m?.proof?.note || m?.proof?.url ? 1 : 0;

  return (
    <EdgePageAmbiance ambiance="skills">
      <div className={`${APPRENANT_PAGE_SHELL} max-w-2xl pb-24`}>
        <Link
          href="/dashboard/apprenant/skills/competences"
          className="text-[13px] text-white/40 transition hover:text-white"
        >
          ← Mes compétences
        </Link>

        {loading && (
          <div className="mt-8">
            <SkillsEmptyHint>Chargement…</SkillsEmptyHint>
          </div>
        )}

        {!loading && !record && (
          <div className="mt-8 space-y-4">
            <h1 className="text-[28px] font-bold text-white">{skillName || "Compétence"}</h1>
            <SkillsEmptyHint>Cette compétence n’est pas encore dans votre capital.</SkillsEmptyHint>
            <Link
              href={`/dashboard/apprenant/skills/develop?skill=${encodeSkillParam(skillName)}`}
              className={CONNECT_BTN_PRIMARY}
            >
              Développer cette compétence
            </Link>
          </div>
        )}

        {!loading && record && (
          <>
            <header className="mt-6 space-y-4">
              <SkillsSectionKicker>{record.category}</SkillsSectionKicker>
              <h1 className="text-[32px] font-bold tracking-[-0.03em] text-white sm:text-[40px]">
                {record.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[15px] text-white/70">Niveau · {record.level}</span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusUi.className}`}
                >
                  {statusUi.label}
                </span>
              </div>
            </header>

            <section className="mt-10 space-y-3">
              <p className="text-[12px] uppercase tracking-[0.14em] text-white/35">
                Progression / maîtrise
              </p>
              <div className="flex items-end justify-between gap-4">
                <p className="text-[40px] font-bold tabular-nums tracking-[-0.04em] text-white">
                  {progress}&nbsp;%
                </p>
                <p className="pb-2 text-[13px] text-white/40">
                  Objectif {target} · {masteryBarFilled(record.level)}/5
                </p>
              </div>
              <SkillsProgressBar value={progress} />
            </section>

            <section className="mt-10 grid grid-cols-2 gap-6">
              <div>
                <p className="text-[12px] uppercase tracking-[0.14em] text-white/35">Preuves</p>
                <p className="mt-1 text-[28px] font-bold tabular-nums text-white">{proofCount}</p>
              </div>
              <div>
                <p className="text-[12px] uppercase tracking-[0.14em] text-white/35">Statut</p>
                <p className="mt-1 text-[18px] font-semibold text-white">{statusUi.label}</p>
              </div>
            </section>

            <section className="mt-10 space-y-3">
              <p className="text-[12px] uppercase tracking-[0.14em] text-white/35">
                Historique de progression
              </p>
              <ul className="space-y-2 text-[13px] text-white/50">
                <li>Niveau déclaré · {record.level}</li>
                {m?.trainingStartedAt && (
                  <li>
                    Entraînement démarré ·{" "}
                    {new Date(m.trainingStartedAt).toLocaleDateString("fr-FR")}
                  </li>
                )}
                {m?.proof?.note && <li>Preuve · {m.proof.note}</li>}
                {m?.validation?.status && <li>Validation · {m.validation.status}</li>}
                {!m?.trainingStartedAt && !m?.proof && !m?.validation && (
                  <li>Première étape : démarrez un entraînement ou ajoutez une preuve.</li>
                )}
              </ul>
            </section>

            <section className="mt-10 space-y-3">
              <p className="text-[12px] uppercase tracking-[0.14em] text-white/35">
                Sources de validation
              </p>
              <div className="flex flex-wrap gap-2">
                {VALIDATION_SOURCES.map((src) => (
                  <span
                    key={src}
                    className="rounded-full border border-white/[0.08] px-3 py-1.5 text-[12px] text-white/45"
                  >
                    {src}
                  </span>
                ))}
              </div>
            </section>

            <div className="mt-12 flex flex-wrap gap-3">
              <Link
                href={`/dashboard/apprenant/skills/develop?skill=${encodeSkillParam(record.name)}`}
                className={CONNECT_BTN_PRIMARY}
              >
                Développer cette compétence
              </Link>
              <Link
                href={`/dashboard/apprenant/skills/prove?skill=${encodeSkillParam(record.name)}`}
                className={CONNECT_BTN_SECONDARY}
              >
                Ajouter une preuve
              </Link>
            </div>
          </>
        )}
      </div>
    </EdgePageAmbiance>
  );
}
