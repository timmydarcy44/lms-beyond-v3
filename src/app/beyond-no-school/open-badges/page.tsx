"use client";

import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { BnsPrivateHeader } from "@/components/beyond-no-school/bns-private-header";

export default function BeyondNoSchoolOpenBadgesPage() {
  const [badgeClasses, setBadgeClasses] = useState<
    Array<{
      id: string;
      name: string;
      description: string;
      requiresEnrollment: boolean;
      requiredCourseId?: string | null;
      eligible: boolean;
    }>
  >([]);

  useEffect(() => {
    const loadBadges = async () => {
      const res = await fetch("/api/earner/badgeclasses");
      if (!res.ok) return;
      const json = await res.json();
      setBadgeClasses(json.badgeClasses ?? []);
    };
    loadBadges();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b10] pb-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,88,61,0.18),transparent_45%),radial-gradient(circle_at_82%_20%,rgba(80,130,255,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(180deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:2px_2px]" />

      <BnsPrivateHeader />

      <section className="mx-auto max-w-6xl space-y-8 px-6 pb-20 pt-12 sm:px-12 lg:px-24">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Open Badges</p>
          <h1 className="text-pretty text-4xl font-semibold sm:text-5xl">Mes Open Badges</h1>
          <p className="text-lg text-white/70">
            Quand une preuve est validée, ton badge devient public et vérifiable.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <p className="text-sm text-white/70">Badges obtenus</p>
            <p className="mt-3 text-xs text-white/50">Aucun badge validé pour l’instant.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <p className="text-sm text-white/70">Badges en cours</p>
            <p className="mt-3 text-xs text-white/50">Ils apparaîtront ici au fur et à mesure.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <p className="text-sm text-white/70">Badges disponibles</p>
          {badgeClasses.length === 0 ? (
            <p className="mt-3 text-xs text-white/50">Aucun badge disponible.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {badgeClasses.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{badge.name}</p>
                    <p className="text-xs text-white/60">{badge.description}</p>
                  </div>
                  <Button
                    className="rounded-full bg-white px-4 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90 disabled:opacity-40"
                    disabled={!badge.eligible}
                    asChild={badge.eligible}
                  >
                    {badge.eligible ? (
                      <Link href={`/beyond-no-school/open-badges/${badge.id}/submit`}>
                        Soumettre
                      </Link>
                    ) : (
                      "Formation requise"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button className="rounded-full bg-white px-6 text-xs uppercase tracking-[0.3em] text-black hover:bg-white/90">
            Comprendre la validation
          </Button>
          <Button className="rounded-full border border-white/15 bg-transparent px-6 text-xs uppercase tracking-[0.3em] text-white/70 hover:text-white">
            Connecter mes Open Badges à Beyond Connect
          </Button>
          <div className="flex items-center gap-2 text-xs text-white/50">
            <BadgeCheck className="h-4 w-4 text-white/60" />
            Validation humaine, traçabilité publique.
          </div>
        </div>
      </section>
    </main>
  );
}

