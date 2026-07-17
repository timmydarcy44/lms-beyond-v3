"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Share2 } from "lucide-react";
import { edgeLevelFromXp } from "@/lib/apprenant/edge-gamification";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";
import type { ProfilEdgeMaturity } from "@/lib/particulier/profil-edge-maturity";
import { useApprenantShell } from "@/components/apprenant/apprenant-shell-context";
import { HubPillCta, HubProgressBar, HubSurface } from "./hub-ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  objectiveLabel: string;
  hasProject: boolean;
  maturity: ProfilEdgeMaturity;
  hardSkillsCount: number;
  badgeCountHint: number;
  badgeAwarded: boolean;
};

export function ProfileSynthesisCard({
  firstName,
  lastName,
  avatarUrl,
  objectiveLabel,
  hasProject,
  maturity,
  hardSkillsCount,
  badgeCountHint,
  badgeAwarded,
}: Props) {
  const shell = useApprenantShell();
  const [totalXp, setTotalXp] = useState(0);
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "Votre profil";
  const level = edgeLevelFromXp(totalXp);
  const profileComplete = maturity.totalPercent >= 80;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase.from("edge_xp_events").select("amount").eq("user_id", user.id);
      if (cancelled) return;
      setTotalXp((data ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <HubSurface tone="ocean" className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/10">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill className="object-cover" sizes="64px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/70">
              {(firstName?.[0] || lastName?.[0] || "E").toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-white/45">Synthèse du profil</p>
          <h2 className="mt-1 truncate text-[1.45rem] font-bold tracking-[-0.03em] text-white">
            {displayName}
          </h2>
          <p className="mt-1 truncate text-[14px] text-white/55">
            {hasProject ? objectiveLabel : "Objectif professionnel à définir"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-white/[0.04] px-3 py-3">
          <p className="text-[12px] text-white/45">Niveau EDGE</p>
          <p className="mt-1 text-[18px] font-semibold text-white">{level.level}</p>
          <p className="text-[12px] text-white/40">{level.title}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.04] px-3 py-3">
          <p className="text-[12px] text-white/45">Complétion</p>
          <p className="mt-1 text-[18px] font-semibold tabular-nums text-white">
            {maturity.totalPercent}%
          </p>
          <HubProgressBar value={maturity.totalPercent} className="mt-2" />
        </div>
        <div className="rounded-2xl bg-white/[0.04] px-3 py-3">
          <p className="text-[12px] text-white/45">Compétences</p>
          <p className="mt-1 text-[18px] font-semibold tabular-nums text-white">{hardSkillsCount}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.04] px-3 py-3">
          <p className="text-[12px] text-white/45">Badges</p>
          <p className="mt-1 text-[18px] font-semibold tabular-nums text-white">
            {badgeAwarded ? Math.max(1, badgeCountHint) : badgeCountHint}
          </p>
        </div>
      </div>

      <p className="text-[14px] text-white/50">
        Profil public :{" "}
        {profileComplete ? "prêt à partager" : "complétez votre profil pour le partager"}
      </p>

      {profileComplete ? (
        <button
          type="button"
          onClick={() => void shell?.sharePublicProfile?.()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3.5 text-[15px] font-semibold text-white"
        >
          <Share2 className="h-4 w-4" />
          Voir mon profil public
        </button>
      ) : (
        <Link href={PROFIL_EDGE_SECTION_HREFS.identite}>
          <HubPillCta>
            Compléter mon profil
            <ArrowRight className="h-4 w-4" />
          </HubPillCta>
        </Link>
      )}
    </HubSurface>
  );
}
