"use client";

import { FileCheck2, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { resolveToolLogo } from "@/lib/profile/competency-referential";
import {
  resolveSkillUxStatus,
  type LearnerHardSkillRecord,
  type StoredHardSkillMeta,
} from "@/lib/hard-skills/hard-skills-portfolio";
import { SkillStatusBadge } from "@/components/hard-skills/skill-status-badge";
import { cn } from "@/lib/utils";

type Props = {
  record: LearnerHardSkillRecord;
  meta?: StoredHardSkillMeta;
  onEdit: () => void;
  onProof: () => void;
  onEvaluate: () => void;
  onDelete: () => void;
};

export function SkillCard({ record, meta, onEdit, onProof, onEvaluate, onDelete }: Props) {
  const logo = resolveToolLogo(record.name);
  const status = resolveSkillUxStatus(meta ?? { proofLevel: record.proofLevel, proof: record.proof });
  const proofCount = meta?.proof?.url || meta?.proof?.note ? 1 : 0;
  const validatedAt = meta?.validation?.analyzedAt;

  return (
    <article className="rounded-[22px] border border-white/[0.08] bg-gradient-to-br from-[#151A24] to-[#0C1018] p-5 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.65)]">
      <div className="flex items-start gap-3">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="mt-0.5 h-9 w-9 shrink-0 rounded-lg object-contain bg-white/5 p-1" />
        ) : (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white/70">
            {record.name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-white">{record.name}</h3>
            <SkillStatusBadge status={status} />
          </div>
          <p className="mt-1 text-[13px] text-white/45">{record.category}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
        <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
          <dt className="text-white/40">Niveau déclaré</dt>
          <dd className="mt-0.5 font-semibold text-white">{record.level}</dd>
        </div>
        <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
          <dt className="text-white/40">Statut</dt>
          <dd className="mt-0.5 font-semibold text-white">
            {status === "validated"
              ? "Validée EDGE"
              : status === "evaluated"
                ? "Évaluée"
                : status === "proved"
                  ? "Prouvée"
                  : "Auto-déclarée"}
          </dd>
        </div>
        {status === "validated" || status === "proved" ? (
          <>
            <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
              <dt className="text-white/40">Preuves</dt>
              <dd className="mt-0.5 font-semibold text-white">{proofCount}</dd>
            </div>
            {validatedAt ? (
              <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
                <dt className="text-white/40">Dernière validation</dt>
                <dd className="mt-0.5 font-semibold text-white">
                  {new Date(validatedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
            ) : null}
          </>
        ) : null}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onProof}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-2 text-[13px] font-medium text-white/85 hover:bg-white/[0.08]"
        >
          <FileCheck2 className="h-3.5 w-3.5" />
          Déposer une preuve
        </button>
        <button
          type="button"
          onClick={onEvaluate}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#3D7BFF]/35 bg-[#3D7BFF]/10 px-3.5 py-2 text-[13px] font-medium text-[#B8D0FF] hover:bg-[#3D7BFF]/18"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Passer une évaluation
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-[13px] font-medium text-white/55 hover:text-white"
        >
          <Pencil className="h-3.5 w-3.5" />
          Modifier
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-2 text-[13px] font-medium text-white/40 hover:border-rose-400/30 hover:text-rose-300",
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Supprimer
        </button>
      </div>
    </article>
  );
}
