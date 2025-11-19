import Image from "next/image";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SectionSlider } from "@/components/dashboard/section-slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";

export default async function LearnerParcoursIndexPage() {
  const data = await getApprenantDashboardData();
  const assigned = data.parcours;
  const curated = data.parcours.slice(0, 6);

  return (
    <DashboardShell
      title="Parcours"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/apprenant" },
        { label: "Parcours" },
      ]}
    >
      <div className="space-y-12">
        <section className="space-y-6">
          <header className="space-y-3">
            <h1 className="text-3xl font-semibold text-white md:text-4xl">Vos parcours guidés</h1>
            <p className="max-w-3xl text-sm text-white/65">
              Retrouvez ici tous les programmes dans lesquels vous êtes inscrit. Chaque carte rassemble les formations, tests
              et ressources associés : sélectionnez un parcours pour découvrir sa feuille de route complète et lancer votre
              prochaine étape.
            </p>
          </header>

          {assigned.length ? (
            assigned.length > 3 ? (
              <SectionSlider title="Vos parcours assignés" cards={assigned as any} accent="learner" />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {assigned.map((parcours) => (
                  <Link key={parcours.id} href={parcours.href} className="group">
                    <Card className="overflow-hidden border-white/10 bg-white/5 text-white transition hover:border-white/25 hover:bg-white/10">
                      <div className="relative h-48 w-full">
                        {parcours.image && (
                          <Image
                            src={parcours.image}
                            alt={parcours.title}
                            fill
                            className="object-cover opacity-85 transition group-hover:scale-105 group-hover:opacity-100"
                            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                          />
                        )}
                      </div>
                      <CardContent className="space-y-4 p-5">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/45">
                            <span>{parcours.meta ?? "Parcours immersif"}</span>
                            {(parcours as any).badge ? (
                              <Badge className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
                                {(parcours as any).badge}
                              </Badge>
                            ) : null}
                          </div>
                          <h2 className="text-lg font-semibold text-white group-hover:text-white/90">{parcours.title}</h2>
                          <p className="text-sm text-white/60">
                            Accédez à la présentation du parcours pour consulter les formations, tests et ressources associés.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.3em] text-white/45">
                          <span>Formations + Tests + Ressources</span>
                          <span className="border border-white/15 px-3 py-1">Explorer</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-white/70">
              Aucun parcours n’est encore assigné. Votre formateur vous inscrira prochainement à un programme dédié.
            </div>
          )}
        </section>

        {curated.length ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Autres parcours recommandés</h2>
              <Button
                variant="ghost"
                className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:bg-white/10"
              >
                Voir la bibliothèque complète
              </Button>
            </div>
            <SectionSlider 
              title="Parcours à explorer" 
              cards={curated.map(card => ({ 
                ...card, 
                cta: card.cta ?? undefined,
                meta: card.meta ?? undefined,
                progress: card.progress ?? undefined,
              }))} 
              accent="learner" 
            />
          </section>
        ) : null}
      </div>
    </DashboardShell>
  );
}
