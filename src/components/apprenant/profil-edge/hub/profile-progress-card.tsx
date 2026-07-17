"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProfilEdgeMaturity } from "@/lib/particulier/profil-edge-maturity";
import { edgeLevelFromXp } from "@/lib/apprenant/edge-gamification";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { HubPillCta, HubProgressBar, HubSectionHeader, HubSurface } from "./hub-ui";

type Props = {
  maturity: ProfilEdgeMaturity;
};

function nextIncompleteHint(maturity: ProfilEdgeMaturity): { href: string; text: string } {
  const incomplete = maturity.blocks.find((b) => !b.complete);
  if (!incomplete) {
    return {
      href: PROFIL_EDGE_SECTION_HREFS.experiences,
      text: "Votre profil est bien avancé. Enrichissez-le pour affiner encore les recommandations.",
    };
  }
  const hints: Record<string, string> = {
    identite: "Complétez votre identité pour personnaliser votre espace.",
    projet: "Précisez votre projet pour activer l’alignement métier.",
    tests: "Terminez vos explorations EDGE pour débloquer le badge.",
    experiences: "Ajoutez vos expériences pour obtenir des recommandations plus précises.",
    diplomes: "Ajoutez vos diplômes pour renforcer votre profil.",
    hard_skills: "Déclarez vos hard skills pour affiner le matching.",
  };
  return {
    href: incomplete.href,
    text: hints[incomplete.id] ?? `Complétez « ${incomplete.label} » pour progresser.`,
  };
}

export function ProfileProgressCard({ maturity }: Props) {
  const [totalXp, setTotalXp] = useState(0);
  const [ready, setReady] = useState(false);

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
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const level = edgeLevelFromXp(totalXp);
  const hint = nextIncompleteHint(maturity);

  return (
    <section>
      <HubSectionHeader
        title="Ma progression"
        subtitle="Complétion du profil — distincte de l’alignement métier."
      />
      <HubSurface tone="slate" className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[13px] font-medium text-white/70">Profil complété</p>
            <p className="mt-1 text-[4rem] font-bold tabular-nums tracking-[-0.05em] text-white leading-none">
              {maturity.totalPercent}
              <span className="text-[1.75rem] text-white/50">%</span>
            </p>
          </div>
          <div className="rounded-2xl bg-black/20 px-4 py-3 text-right backdrop-blur-sm">
            <p className="text-[12px] text-white/65">Niveau {ready ? level.level : "—"}</p>
            <p className="mt-1 text-[15px] font-semibold text-white">
              {ready ? level.title : "…"}
            </p>
            <p className="mt-0.5 text-[13px] text-white/70">{ready ? `${level.totalXp} XP` : "—"}</p>
          </div>
        </div>

        <HubProgressBar value={maturity.totalPercent} />

        <div>
          <div className="mb-1.5 flex justify-between text-[12px] text-white/65">
            <span>Prochain niveau</span>
            <span>{ready ? `${level.xpIntoLevel} / ${level.xpForNextLevel} XP` : "—"}</span>
          </div>
          <HubProgressBar value={ready ? level.percentToNext : 0} />
        </div>

        <p className="text-[15px] leading-relaxed text-white/85">{hint.text}</p>

        <Link href={hint.href}>
          <HubPillCta>
            Continuer mon profil
            <ArrowRight className="h-4 w-4" />
          </HubPillCta>
        </Link>
      </HubSurface>
    </section>
  );
}
