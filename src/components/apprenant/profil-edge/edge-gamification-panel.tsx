"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { edgeLevelFromXp } from "@/lib/apprenant/edge-gamification";
import { EdgeDailyMissionCard } from "@/components/apprenant/profil-edge/edge-daily-mission-card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  matching: CareerMatchingResult;
  objective?: string;
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

export function EdgeGamificationPanel({ matching, objective }: Props) {
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [statsReady, setStatsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const [xpRes, streakRes] = await Promise.all([
        supabase.from("edge_xp_events").select("amount").eq("user_id", user.id),
        supabase.from("edge_streaks").select("current_streak").eq("user_id", user.id).maybeSingle(),
      ]);

      if (cancelled) return;
      setTotalXp((xpRes.data ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0));
      setStreak(Number(streakRes.data?.current_streak) || 0);
      setStatsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const level = edgeLevelFromXp(totalXp);

  return (
    <div className="space-y-4">
      <EdgeDailyMissionCard matching={matching} objective={objective} />

      <motion.section
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3D7BFF]/15 text-[#8BB4FF]">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Niveau {level.level} · {level.title}
              </p>
              <p className="text-sm text-white/60">
                <span className="font-semibold text-white">{statsReady ? level.totalXp : "—"} XP</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-400/10 px-3 py-1">
            <Flame className="h-3.5 w-3.5 text-orange-300" />
            <span className="text-sm font-medium text-orange-200">
              {statsReady ? streak : "—"} jour{streak > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-white/40">
            <span>Progression</span>
            <span>
              {level.xpIntoLevel} / {level.xpForNextLevel} XP
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-[#3D7BFF]"
              initial={{ width: 0 }}
              animate={{ width: statsReady ? `${level.percentToNext}%` : "0%" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </motion.section>
    </div>
  );
}
