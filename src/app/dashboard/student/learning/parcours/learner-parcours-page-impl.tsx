"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LearnerPathProgramHero } from "@/components/apprenant/learner-path-program-hero";
import type { ApprenantDashboardData, LearnerCard } from "@/lib/queries/apprenant";

export type FeaturedParcoursHero = {
  pathId: string;
  title: string;
  resumeHref: string;
  coverUrl: string | null;
  coverIsVideo: boolean;
  presentation: string | null;
  objectifs: unknown[] | null | undefined;
  tools: string[];
  formationCount: number;
  testCount: number;
  resourceCount: number;
};

export type LearnerParcoursPageImplProps = {
  data: ApprenantDashboardData;
  orgSlug?: string | null;
  featuredHero?: FeaturedParcoursHero | null;
};

function isVideoLike(url: string): boolean {
  const s = String(url ?? "").trim().toLowerCase();
  return s.endsWith(".mp4") || s.endsWith(".webm") || s.startsWith("data:video/");
}

export function LearnerParcoursPageImpl({ data, orgSlug, featuredHero }: LearnerParcoursPageImplProps) {
  const assigned = data.parcours ?? [];

  if (assigned.length === 0) {
    return (
      <DashboardShell forceSidebar hideHeader title="" subtitle="" mainClassName="!px-0 !pt-0">
        <div className="px-6 py-12 text-white/70">vous n&apos;avez pas encore de parcours attitré</div>
      </DashboardShell>
    );
  }

  const title = useMemo(() => String(assigned[0]?.title ?? "Parcours").trim() || "Parcours", [assigned]);

  return (
    <DashboardShell forceSidebar hideHeader title="" subtitle="" mainClassName="!px-0 !pt-0">
      {featuredHero ? (
        <div className="flex min-h-[calc(100svh-3.25rem)] w-full flex-col text-white md:min-h-screen">
          <div className="flex min-h-0 flex-1 flex-col">
            <LearnerPathProgramHero
              featuredOverview
              title={featuredHero.title}
              badge={null}
              coverUrl={featuredHero.coverUrl}
              coverIsVideo={featuredHero.coverIsVideo}
              presentation={featuredHero.presentation}
              objectifs={featuredHero.objectifs ?? []}
              tools={featuredHero.tools ?? []}
              resumeHref={featuredHero.resumeHref}
              formationCount={featuredHero.formationCount}
              testCount={featuredHero.testCount}
              resourceCount={featuredHero.resourceCount}
              pathId={featuredHero.pathId}
              primaryCtaHref={`${featuredHero.resumeHref}#composition`}
            />
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-7xl px-6 py-10 text-white">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/55">
              Parcours assignés
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{title}</h1>
            <p className="max-w-2xl text-sm text-white/65">
              Ouvrez un parcours pour retrouver sa feuille de route.
            </p>
          </div>
          {orgSlug ? (
            <Link
              href={`/g/${encodeURIComponent(orgSlug)}/dashboard/student/learning/parcours`}
              className="hidden text-sm font-semibold text-white/70 underline underline-offset-4 hover:text-white md:inline"
            >
              Voir tout
            </Link>
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {assigned.map((p, idx) => {
            const cover = String(p.image ?? "").trim();
            const isVideo = cover ? isVideoLike(cover) : false;
            return (
              <Link
                key={p.id}
                href={p.href}
                className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_50px_140px_-90px_rgba(0,0,0,0.85)] transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <div className="relative aspect-[16/10] w-full">
                  {cover ? (
                    isVideo ? (
                      <video
                        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                        autoPlay
                        muted
                        playsInline
                        loop
                        preload="metadata"
                        src={cover}
                      />
                    ) : (
                      <Image
                        src={cover}
                        alt={p.title}
                        fill
                        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition duration-700 group-hover:scale-[1.03]"
                        priority={idx === 0}
                        loading={idx === 0 ? "eager" : "lazy"}
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                </div>

                <div className="p-6">
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/45">
                      Parcours
                    </div>
                    <div className="text-xl font-semibold leading-snug text-white group-hover:text-white/90">
                      {p.title}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}

export default LearnerParcoursPageImpl;
