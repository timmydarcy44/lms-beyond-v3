"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Sparkles, Trophy, Zap } from "lucide-react";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import {
  computeEdgeXp,
  edgeLevelFromXp,
  getDailyChallenge,
  getSkillOfTheDay,
  touchStreak,
} from "@/lib/apprenant/edge-gamification";
import { pickDailyNotification } from "@/lib/apprenant/edge-coach-notifications";

type Props = {
  matching: CareerMatchingResult;
};

export function EdgeGamificationPanel({ matching }: Props) {
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    setStreak(touchStreak());
  }, []);

  const xp = computeEdgeXp(matching);
  const level = edgeLevelFromXp(xp);
  const daily = getDailyChallenge(matching);
  const skillOfDay = getSkillOfTheDay(matching);
  const notification = pickDailyNotification(matching);

  return (
    <section className="rounded-2xl border border-[#3D7BFF]/25 bg-gradient-to-br from-[#3D7BFF]/[0.12] via-[#3D7BFF]/[0.04] to-transparent p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3D7BFF]/20 text-[#8BB4FF]">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">
              Niveau {level.level} · {level.title}
            </p>
            <p className="mt-0.5 text-sm text-white/60">
              <span className="font-semibold text-white">{level.totalXp} XP</span> — coach EDGE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1.5">
          <Flame className="h-4 w-4 text-orange-300" />
          <span className="text-sm font-semibold text-orange-200">
            {streak} jour{streak > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Barre de progression XP */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-white/45">
          <span>Progression</span>
          <span>
            {level.xpIntoLevel} / {level.xpForNextLevel} XP
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#3D7BFF]" style={{ width: `${level.percentToNext}%` }} />
        </div>
      </div>

      {/* Cartes : compétence du jour + défi du jour */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {skillOfDay ? (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-[#8BB4FF]">
              <Sparkles className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Compétence du jour</span>
            </div>
            <p className="mt-2 text-base font-semibold text-white">{skillOfDay}</p>
            <p className="mt-1 text-xs text-white/50">Mise en avant pour vous aujourd&apos;hui.</p>
          </div>
        ) : null}

        {daily ? (
          <Link
            href={`/dashboard/apprenant/defi?skill=${encodeURIComponent(daily.skill)}&format=${daily.format.id}`}
            className="group rounded-xl border border-[#3D7BFF]/30 bg-[#3D7BFF]/[0.08] p-4 transition hover:border-[#3D7BFF]/50"
          >
            <div className="flex items-center gap-2 text-[#8BB4FF]">
              <Zap className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Défi du jour · +{daily.xpReward} XP</span>
            </div>
            <p className="mt-2 text-base font-semibold text-white">
              {daily.format.emoji} {daily.format.label}
            </p>
            <p className="mt-1 text-xs text-white/50">Compétence : {daily.skill}</p>
          </Link>
        ) : null}
      </div>

      {/* Notification coach personnalisée */}
      {notification ? (
        <Link
          href={notification.href}
          className="mt-3 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 transition hover:border-white/20"
        >
          <span className="text-lg">{notification.emoji}</span>
          <span className="flex-1 text-sm text-white/70">{notification.message}</span>
        </Link>
      ) : null}
    </section>
  );
}
