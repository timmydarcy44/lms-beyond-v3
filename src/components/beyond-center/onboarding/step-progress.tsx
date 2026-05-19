"use client";

import Link from "next/link";
import { cn } from "@/components/beyond-center/beyond-center-shared";

export function StepProgress({
  current,
  total,
  title,
  backHref,
}: {
  current: number;
  total: number;
  title: string;
  backHref?: string;
}) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            Étape {current}/{total}
          </p>
          <h1 className="mt-2 text-[clamp(1.6rem,3.3vw,2.2rem)] font-semibold tracking-[-0.03em] text-slate-900">
            {title}
          </h1>
        </div>
        {backHref ? (
          <Link
            href={backHref}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Retour
          </Link>
        ) : null}
      </div>
      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full bg-[#1D4ED8] transition-[width] duration-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

