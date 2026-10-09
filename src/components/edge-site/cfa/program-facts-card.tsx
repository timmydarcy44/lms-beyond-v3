import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";

import type { ByoundProgramFacts } from "@/lib/byound-school/program-facts";

const rows = [
  ["Format", "format"],
  ["Prochaine rentrée", "nextIntake"],
  ["Durée", "duration"],
  ["Volume", "volume"],
  ["Rythme", "rhythm"],
  ["Lieu", "location"],
  ["Niveau", "level"],
  ["Places disponibles", "seatsAvailable"],
] as const;

export function ProgramFactsCard({ facts }: { facts: ByoundProgramFacts }) {
  return (
    <div className="space-y-3">
      <div className="rounded-[28px] border border-black/[0.08] bg-white p-6 shadow-[0_16px_40px_rgba(7,11,31,0.08)]">
        <dl className="space-y-3.5">
          {rows.map(([label, key]) => (
            <div key={key} className="flex items-start justify-between gap-4 text-sm">
              <dt className="shrink-0 text-black/45">{label}</dt>
              <dd className="text-right font-semibold leading-snug text-[#070b1f]">{facts[key]}</dd>
            </div>
          ))}
        </dl>

        <Link
          href={facts.candidaterHref}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#3b82f6] px-5 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
        >
          Candidater
          <ArrowRight className="h-4 w-4" />
        </Link>

        {facts.programPdfUrl ? (
          <a
            href={facts.programPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-[#f4f7fb] px-5 text-sm font-semibold text-[#3b82f6] transition hover:bg-[#ebf2fb]"
          >
            <Download className="h-4 w-4" />
            Télécharger le programme PDF
          </a>
        ) : null}
      </div>

      <details className="rounded-full border border-black/[0.08] bg-white px-5 py-3 text-sm shadow-sm">
        <summary className="cursor-pointer list-none font-medium text-[#070b1f] marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f1ff] text-xs font-semibold text-[#3b82f6]">
                ♿️
              </span>
              Accessibilité PSH
            </span>
            <span className="text-lg leading-none text-black/30">+</span>
          </span>
        </summary>
        <p className="mt-3 pb-1 text-sm leading-relaxed text-black/55">
          Formation accessible aux personnes en situation de handicap. Adaptations possibles
          selon les besoins, sur demande auprès de l’équipe Byound School.
        </p>
      </details>
    </div>
  );
}
