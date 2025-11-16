import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFormateurCourses, type FormateurCourseListItem } from "@/lib/queries/formateur";
import { FormationsCardsClient } from "./formations-cards-client";
import { cn } from "@/lib/utils";

type FormateurCourse = FormateurCourseListItem;

const statusConfig: Record<FormateurCourse["status"], { label: string; tone: string }> = {
  published: { label: "Publié", tone: "bg-emerald-500/20 text-emerald-200" },
  draft: { label: "Brouillon", tone: "bg-white/10 text-white/60" },
  scheduled: { label: "Programmé", tone: "bg-sky-500/15 text-sky-200" },
};

export default async function FormateurFormationsPage() {
  const formateurCourses = await getFormateurCourses();

  const publishedCount = formateurCourses.filter((course) => course.status === "published").length;
  const draftCount = formateurCourses.filter((course) => course.status === "draft").length;
  return (
    <DashboardShell
      title="Formations formateur"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Formations" },
      ]}
    >
      <section className="flex flex-wrap items-center justify-between gap-4 w-full">
        <div className="space-y-2 flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-white md:text-3xl">Mes formations</h1>
          <p className="max-w-2xl text-sm text-white/70">
            Visualisez vos parcours actifs, mettez à jour vos modules et suivez la progression de vos apprenants.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          <Button asChild className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
            <Link href="/dashboard/formateur/formations/new">Créer une formation</Link>
          </Button>
          <Button
            variant="ghost"
            className="rounded-full border border-white/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80 hover:border-white/40 hover:text-white"
          >
            Importer un plan
          </Button>
        </div>
      </section>

      <Card className="border-white/10 bg-white/5 text-white w-full">
        <CardContent className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-4 w-full">
          <StatTile label="Formations publiées" value={publishedCount} hint="En ligne" tone="bg-emerald-500/10 text-emerald-200" />
          <StatTile label="Brouillons" value={draftCount} hint="À finaliser" tone="bg-white/10 text-white/70" />
          <StatTile label="Apprenants actifs" value={252} hint="Sur vos parcours" tone="bg-sky-500/10 text-sky-100" />
          <StatTile label="Taux de complétion" value={88} suffix="%" hint="Moyenne 30 jours" tone="bg-purple-500/10 text-purple-100" />
        </CardContent>
      </Card>

      <section className="space-y-6 w-full">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/50 w-full">
          <Badge variant="secondary" className="rounded-full bg-white/10 px-3 py-1 text-white/70">
            Tous ({formateurCourses.length})
          </Badge>
          <Badge variant="secondary" className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">
            Publiés ({publishedCount})
          </Badge>
          <Badge variant="secondary" className="rounded-full bg-white/10 px-3 py-1 text-white/70">
            Brouillons ({draftCount})
          </Badge>
        </div>
        {formateurCourses.length === 0 ? (
          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-semibold text-white">Aucune formation</p>
              <p className="mt-2 text-sm text-white/60">
                Créez votre première formation pour commencer à former vos apprenants.
              </p>
              <Button asChild className="mt-6 rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
                <Link href="/dashboard/formateur/formations/new">Créer une formation</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <FormationsCardsClient courses={formateurCourses} statusConfig={statusConfig} />
        )}
      </section>

      <Card className="border-white/10 bg-white/5 text-white w-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-[0.3em] text-white/60">Brouillons à finaliser</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 w-full">
          {formateurCourses
            .filter((course) => course.status !== "published")
            .map((course) => (
              <div
                key={`draft-${course.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-white">{course.title}</p>
                  <p className="text-xs text-white/50">
                    Dernière édition {formatDistanceToNow(new Date(course.updatedAt), { addSuffix: true, locale: fr })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-[0.3em] text-white/40">Progression {course.completion}%</span>
                  <Button
                    variant="ghost"
                    className="rounded-full border border-white/20 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-white/80 hover:border-white/40 hover:text-white"
                  >
                    Continuer
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}

function StatTile({
  label,
  value,
  suffix,
  hint,
  tone,
}: {
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
  tone: string;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">{label}</p>
      <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold", tone)}>
        {value}
        {suffix ? <span>{suffix}</span> : null}
      </span>
      {hint ? <p className="text-xs text-white/50">{hint}</p> : null}
    </div>
  );
}

