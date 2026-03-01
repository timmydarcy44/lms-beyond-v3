import Image from "next/image";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SectionSlider } from "@/components/dashboard/section-slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CinematicHero } from "@/components/dashboard/cinematic-hero";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";

export default async function LearnerParcoursIndexPage() {
  const data = await getApprenantDashboardData();
  const assigned = data.parcours;
  const curated = data.parcours.slice(0, 6);

  return (
    <DashboardShell
      title=""
      breadcrumbs={[]}
      forcedTheme="dark"
      className="bg-[#050505] text-white"
      mainClassName="bg-transparent"
    >
      <CinematicHero
        hero={{
          title: assigned[0]?.title ?? "Pilotez vos parcours immersifs",
          description:
            assigned[0]?.meta ??
            "Découvrez chaque programme, ses formations, tests et ressources associés. Suivez votre feuille de route étape par étape.",
          badge: assigned.length ? "Parcours assignés" : "Catalogue Beyond",
          backgroundImage: assigned[0]?.image ?? null,
          meta: "Parcours",
          tags: ["Parcours"],
        }}
        featured={assigned.length ? assigned : data.parcours}
        stats={[
          { label: "Parcours actifs", value: `${assigned.length}` },
          { label: "Recommandés", value: `${curated.length}` },
        ]}
        activeHref="/dashboard/parcours"
      />

      <div className="relative z-10 -mt-24 mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 pb-20 md:px-10">
        <section className="space-y-8">
          <header className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/60">
              Vos parcours guidés
            </span>
            <div className="space-y-3">
              <h1 className="text-[clamp(30px,3.6vw,48px)] font-semibold leading-tight text-white">
                Pilotez vos parcours immersifs
              </h1>
              <p className="max-w-3xl text-sm text-white/65">
                Retrouvez ici tous les programmes auxquels vous êtes inscrit·e. Chaque carte rassemble les formations, tests et ressources associés : ouvrez un parcours pour dérouler sa feuille de route et planifier votre prochaine étape.
              </p>
            </div>
          </header>

          {assigned.length ? (
                assigned.length > 3 ? (
                  <SectionSlider
                    title="Vos parcours assignés"
                    cards={assigned as any}
                    accent="learner"
                    theme="dark"
                  />
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {assigned.map((parcours) => (
                      <Link key={parcours.id} href={parcours.href} className="group">
                        <Card className="overflow-hidden border-white/10 bg-white/10 text-white transition duration-500 hover:border-white/30 hover:bg-white/15 hover:shadow-[0_32px_80px_-40px_rgba(15,23,42,0.7)]">
                          <div className="relative h-48 w-full">
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/75 via-black/40 to-transparent" />
                            {parcours.image ? (
                              <Image
                                src={parcours.image}
                                alt={parcours.title}
                                fill
                                className="object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-90"
                                sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#202230,#050505)]" />
                            )}
                          </div>
                          <CardContent className="space-y-5 p-6">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.32em] text-white/45">
                                <span>{parcours.meta ?? "Parcours immersif"}</span>
                                {(parcours as any).badge ? (
                                  <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
                                    {(parcours as any).badge}
                                  </Badge>
                                ) : null}
                              </div>
                              <h2 className="text-lg font-semibold text-white group-hover:text-white/90">{parcours.title}</h2>
                              <p className="text-sm text-white/60">
                                Accédez à la présentation du parcours pour consulter les formations, tests et ressources associés.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.3em] text-white/45">
                              <span>Formations + Tests + Ressources</span>
                              <span className="rounded-full border border-white/20 px-3 py-1 text-white/70">Explorer</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )
              ) : (
                <div className="rounded-[28px] border border-dashed border-white/15 bg-white/5 p-8 text-white/65 backdrop-blur-md">
                  Aucun parcours n’est encore assigné. Votre formateur vous inscrira prochainement à un programme dédié.
                </div>
              )}
            </section>

            {curated.length ? (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="text-xl font-semibold text-white">Autres parcours recommandés</h2>
                  <Button
                    variant="ghost"
                    className="rounded-full border border-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70 hover:border-white/35 hover:bg-white/10"
                  >
                    Voir la bibliothèque complète
                  </Button>
                </div>
                <SectionSlider
                  title="Parcours à explorer"
                  cards={curated.map((card) => ({
                    ...card,
                    cta: card.cta ?? undefined,
                    meta: card.meta ?? undefined,
                    progress: card.progress ?? undefined,
                  }))}
                  accent="learner"
                  theme="dark"
                />
              </section>
            ) : null}
      </div>
    </DashboardShell>
  );
}
