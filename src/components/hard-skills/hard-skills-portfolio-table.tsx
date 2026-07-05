"use client";

import { ArrowDown, ArrowUp, Award, FileText, Link2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { resolveToolLogo } from "@/lib/profile/competency-referential";
import {
  CATEGORY_CHIP_CLASS,
  LEVEL_CHIP_CLASS,
  PROOF_LEVEL_CHIP,
  masteryBarFilled,
  type LearnerHardSkillRecord,
  type StoredHardSkillMeta,
} from "@/lib/hard-skills/hard-skills-portfolio";
import { verdictLabel } from "@/lib/hard-skills/skill-validation";
import { cn } from "@/lib/utils";

function ProofLevelChip({ level }: { level: LearnerHardSkillRecord["proofLevel"] }) {
  const config = PROOF_LEVEL_CHIP[level];
  const label = config.locked ? config.label : config.label;
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium", config.className)}>
      {label}
    </span>
  );
}

function MasteryBar({ level }: { level: LearnerHardSkillRecord["level"] }) {
  const filled = masteryBarFilled(level);
  return (
    <div className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn("h-1.5 w-3 rounded-sm", i < filled ? "bg-[#3D7BFF]" : "bg-white/10")}
        />
      ))}
    </div>
  );
}

type Props = {
  records: LearnerHardSkillRecord[];
  validationMeta?: Record<string, StoredHardSkillMeta>;
  onEdit: (record: LearnerHardSkillRecord) => void;
  onAddProof: (record: LearnerHardSkillRecord) => void;
  onDelete: (name: string) => void;
  onMoveUp: (name: string) => void;
  onMoveDown: (name: string) => void;
};

export function HardSkillsPortfolioTable({
  records,
  validationMeta,
  onEdit,
  onAddProof,
  onDelete,
  onMoveUp,
  onMoveDown,
}: Props) {
  if (records.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
        <p className="text-sm font-medium text-white/70">Aucune compétence enregistrée</p>
        <p className="mt-2 text-sm text-white/40">
          Ajoutez vos compétences depuis le catalogue EDGE ou manuellement.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-white/45">
            <th className="px-4 py-3 font-medium">Compétence</th>
            <th className="px-4 py-3 font-medium">Catégorie</th>
            <th className="px-4 py-3 font-medium">Niveau</th>
            <th className="px-4 py-3 font-medium">Maîtrise</th>
            <th className="px-4 py-3 font-medium">Preuve</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, index) => {
            const logo = resolveToolLogo(record.name);
            const catClass = CATEGORY_CHIP_CLASS[record.category] ?? "bg-white/8 text-white/60 border-white/15";
            const validation = validationMeta?.[record.name]?.validation;
            const showBadgeCta = validation?.verdict === "validated" && validation.badgeSuggested !== false;

            return (
              <tr key={record.name} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    {logo ? (
                      <img src={logo} alt="" className="h-5 w-5 shrink-0 rounded-sm object-contain" />
                    ) : (
                      <span className="h-5 w-5 shrink-0 rounded-sm bg-white/10" />
                    )}
                    <div>
                      <span className="font-medium text-white">{record.name}</span>
                      {validation?.verdict ? (
                        <p className="mt-0.5 text-[11px] text-white/40">{verdictLabel(validation.verdict)}</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium", catClass)}>
                    {record.category}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                      LEVEL_CHIP_CLASS[record.level],
                    )}
                  >
                    {record.level}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <MasteryBar level={record.level} />
                </td>
                <td className="px-4 py-3.5">
                  <ProofLevelChip level={record.proofLevel} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMoveUp(record.name)}
                      className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-30"
                      title="Monter"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === records.length - 1}
                      onClick={() => onMoveDown(record.name)}
                      className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-30"
                      title="Descendre"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(record)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddProof(record)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white"
                    >
                      {record.proof?.url ? <Link2 className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                      Preuve
                    </button>
                    {showBadgeCta ? (
                      <Link
                        href="/dashboard/apprenant/badges"
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10"
                      >
                        <Award className="h-3.5 w-3.5" />
                        Badge
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onDelete(record.name)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-white/40 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
