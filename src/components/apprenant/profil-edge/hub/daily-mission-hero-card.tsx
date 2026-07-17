"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Zap } from "lucide-react";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import type { DailyMissionPreview } from "@/lib/apprenant/edge-coach-memory";
import { missionHref } from "@/lib/apprenant/edge-mission-types";
import { HubPillCta, HubSectionHeader, HubSurface } from "./hub-ui";

type Props = {
  matching: CareerMatchingResult;
  objective?: string;
};

export function DailyMissionHeroCard({ matching, objective }: Props) {
  const [preview, setPreview] = useState<DailyMissionPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/learner/edge-mission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "daily",
            strengths: matching.strengths,
            consolidate: matching.consolidate,
            develop: matching.develop,
            unevaluated: matching.unevaluated,
            nextPriority: matching.nextPriority,
            compatibilityScore: matching.compatibilityScore,
          }),
        });
        const json = await res.json();
        if (!cancelled && res.ok) setPreview(json.preview as DailyMissionPreview);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [matching]);

  if (loading) {
    return (
      <section>
        <HubSectionHeader title="Ma mission" />
        <HubSurface tone="action" className="min-h-[260px] animate-pulse" />
      </section>
    );
  }

  if (!preview) return null;

  const href = missionHref(preview.skill, objective ? { objective } : undefined);
  const why =
    preview.whyImportant ||
    preview.whyToday?.[0] ||
    "C’est la compétence qui peut actuellement avoir le plus d’impact sur votre objectif professionnel.";

  return (
    <section>
      <HubSectionHeader title="Ma mission" />
      <HubSurface tone="action" className="min-h-[300px] flex flex-col justify-between gap-6">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/70">
            Aujourd&apos;hui
          </p>
          <h3 className="mt-3 text-[1.85rem] font-bold leading-[1.1] tracking-[-0.035em] text-white sm:text-[2.1rem]">
            Travaillez votre {preview.skill}
          </h3>
          <p className="mt-4 text-[16px] leading-relaxed text-white/80">{why}</p>
        </div>

        <div className="flex flex-wrap gap-3 text-[13px] font-medium text-white/75">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5">
            <Clock className="h-3.5 w-3.5" />
            {preview.estimatedMinutes} min
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5">
            <Zap className="h-3.5 w-3.5" />+{preview.xpReward} XP
          </span>
          <span className="inline-flex items-center rounded-full bg-black/20 px-3 py-1.5">
            Impact {preview.impact.toLowerCase()}
          </span>
        </div>

        <Link href={href}>
          <HubPillCta>
            Commencer ma mission
            <ArrowRight className="h-4 w-4" />
          </HubPillCta>
        </Link>
      </HubSurface>
    </section>
  );
}
