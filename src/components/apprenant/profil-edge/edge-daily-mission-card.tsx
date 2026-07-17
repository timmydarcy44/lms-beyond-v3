"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Sparkles, Target, Zap } from "lucide-react";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import type { DailyMissionPreview } from "@/lib/apprenant/edge-coach-memory";
import { missionHref } from "@/lib/apprenant/edge-mission-types";
import { ProfilEdgeHubCard } from "./profil-edge-hub-card";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";

type Props = {
  matching: CareerMatchingResult;
  objective?: string;
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = { show: { transition: { staggerChildren: 0.06 } } };

export function EdgeDailyMissionCard({ matching, objective }: Props) {
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
      <ProfilEdgeHubCard variant="accent" className="min-h-[280px] justify-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-[#3D7BFF]/20" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
            <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
          </div>
        </div>
        <p className="text-sm text-white/40">Le Coach EDGE prépare votre mission du jour…</p>
      </ProfilEdgeHubCard>
    );
  }

  if (!preview) return null;

  const href = missionHref(preview.skill, objective ? { objective } : undefined);

  return (
    <motion.div initial="hidden" animate="show" variants={stagger}>
      <ProfilEdgeHubCard variant="accent" className="gap-6 overflow-hidden p-0">
        <motion.div variants={fadeUp} className="border-b border-white/[0.06] px-6 py-5 sm:px-7">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#3D7BFF]/25 text-[#8BB4FF]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8BB4FF]">Coach EDGE</p>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/80">{preview.greeting}</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-5 px-6 pb-7 sm:px-7">
          <motion.div variants={fadeUp}>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#8BB4FF]">Mission du jour</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">{preview.skill}</h2>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
            <MetaPill icon={Clock} label={`${preview.estimatedMinutes} min`} />
            <MetaPill icon={Target} label={`Impact ${preview.impact.toLowerCase()}`} />
            <MetaPill icon={Zap} label={`+${preview.xpReward} XP`} />
            <span className="inline-flex items-center rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/50">
              {preview.difficulty}
            </span>
          </motion.div>

          <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-2">
            <InfoBlock title="Pourquoi aujourd'hui ?" items={preview.whyToday} />
            <InfoBlock title="Ce que vous allez apprendre" items={preview.learnings} />
          </motion.div>

          <motion.p variants={fadeUp} className="text-[14px] leading-relaxed text-white/55">
            <span className="font-medium text-white/75">Pourquoi c&apos;est important : </span>
            {preview.whyImportant}
          </motion.p>

          <motion.div variants={fadeUp}>
            <Link
              href={href}
              className={`${CONNECT_BTN_PRIMARY} group inline-flex w-full items-center justify-center gap-2 py-4 text-[15px]`}
            >
              Commencer ma mission
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>
      </ProfilEdgeHubCard>
    </motion.div>
  );
}

function MetaPill({ icon: Icon, label }: { icon: typeof Clock; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/60">
      <Icon className="h-3.5 w-3.5 text-[#8BB4FF]" />
      {label}
    </span>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-white/70">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#8BB4FF]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
