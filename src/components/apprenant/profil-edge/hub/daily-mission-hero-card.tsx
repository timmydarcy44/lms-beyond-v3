"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Zap } from "lucide-react";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import type { DailyMissionPreview } from "@/lib/apprenant/edge-coach-memory";
import { missionHref } from "@/lib/apprenant/edge-mission-types";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import { HubSectionHeader, HubSurface } from "./hub-ui";

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
        <HubSurface tone="action" className="min-h-[200px] animate-pulse space-y-3">
          <div className="h-4 w-40 rounded bg-white/10" />
          <div className="h-8 w-3/4 rounded bg-white/10" />
          <div className="h-16 rounded bg-white/5" />
        </HubSurface>
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
      <HubSurface tone="action" className="relative overflow-hidden space-y-5">
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-[#3D7BFF]/10 blur-3xl"
          aria-hidden
        />
        <div className="relative space-y-5">
          <div>
            <p className="text-[12px] text-white/45">Aujourd&apos;hui</p>
            <h3 className="mt-1 text-[1.5rem] font-semibold tracking-[-0.03em] text-white sm:text-[1.65rem]">
              Travaillez votre {preview.skill}
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-white/55">{why}</p>
          </div>

          <div className="flex flex-wrap gap-3 text-[12px] text-white/50">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {preview.estimatedMinutes} min
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />+{preview.xpReward} XP
            </span>
            <span>Impact {preview.impact.toLowerCase()}</span>
            <span>{preview.difficulty}</span>
          </div>

          <Link href={href} className={`${CONNECT_BTN_PRIMARY} w-full justify-center py-3.5`}>
            Commencer ma mission
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </HubSurface>
    </section>
  );
}
