"use client";

import { useState } from "react";
import { FileText, FileUp, ListChecks, Mic, Sparkles, Video, type LucideIcon } from "lucide-react";
import { criterionCoverage, methodDisplayName, type CoverageTone } from "@/lib/openbadges/criterion-coverage";

const METHOD_ICONS: Record<string, LucideIcon> = {
  case_study: FileText,
  video: Video,
  playground: Sparkles,
  qcm: ListChecks,
  dictation: Mic,
  pdf_upload: FileUp,
};

const TONE: Record<CoverageTone, string> = {
  covered: "Couvert",
  qcm: "QCM seul · à renforcer",
  missing: "Non couvert · bloquant",
};

const TONE_COLOR: Record<CoverageTone, string> = {
  covered: "#3DDCAB",
  qcm: "#F2C15A",
  missing: "#F07178",
};

export function BadgeCoveragePanel({
  criteria,
  methods,
  links,
  onCover,
}: {
  criteria: Array<{ id: string; label: string }>;
  methods: string[];
  links: Record<string, string[]>;
  onCover: (criterionId: string, methodId: string) => void;
}) {
  const [picking, setPicking] = useState<string | null>(null);
  const rows = criterionCoverage(criteria, methods.map((id) => ({ id, criterionIds: links[id] ?? [] })));
  const missing = rows.filter((row) => row.tone === "missing").length;
  const choices = ["case_study", "video", "playground", "qcm", "dictation", "pdf_upload"];

  return (
    <aside className="lg:sticky lg:top-6">
      <div className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Couverture des critères</h2>
          <span className="rounded-full px-3 py-1 text-xs" style={{ color: missing ? "#F07178" : "#3DDCAB", border: `1px solid ${missing ? "#F07178" : "#3DDCAB"}` }}>
            {missing ? `${missing} non couvert${missing > 1 ? "s" : ""}` : "Tout est couvert"}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-[#8C94B2]">
                <th className="py-2 pr-3 font-medium">Critère</th>
                {methods.map((id) => {
                  const Icon = METHOD_ICONS[id] ?? FileText;
                  return (
                    <th key={id} className="px-1 py-2 text-center font-medium">
                      <Icon className="mx-auto h-4 w-4" aria-label={methodDisplayName(id)} />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const criterion = criteria.find((item) => item.id === row.id);
                return (
                  <tr key={row.id} className="border-t border-[#1A2340]">
                    <td className="py-2 pr-3">
                      <p>{criterion?.label}</p>
                      <p className="text-xs" style={{ color: TONE_COLOR[row.tone] }}>{TONE[row.tone]}</p>
                    </td>
                    {methods.map((id) => (
                      <td key={id} className="px-1 text-center">{row.methodIds.includes(id) ? "✓" : "—"}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.find((row) => row.tone === "missing") ? (
          <div className="mt-4">
            <button type="button" className="bb-white rounded-full px-4 py-2 text-sm font-semibold" onClick={() => setPicking(rows.find((row) => row.tone === "missing")?.id ?? null)}>
              Couvrir « {criteria.find((item) => item.id === rows.find((row) => row.tone === "missing")?.id)?.label || "ce critère"} »
            </button>
            {picking ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {choices.map((id) => (
                  <button key={id} type="button" className="rounded-full border border-[#26304F] px-3 py-1 text-sm" onClick={() => { onCover(picking, id); setPicking(null); }}>
                    {methodDisplayName(id)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
