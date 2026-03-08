import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { FormateurSidebar } from "@/components/formateur/formateur-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFormateurCourses, type FormateurCourseListItem } from "@/lib/queries/formateur";
import { FormationsCardsClient } from "./formations-cards-client";
import { cn } from "@/lib/utils";

type FormateurCourse = FormateurCourseListItem;

const statusConfig: Record<FormateurCourse["status"], { label: string; tone: string }> = {
  published: { label: "Publié", tone: "bg-emerald-500/15 text-emerald-100 border border-emerald-400/30" },
  draft: { label: "Brouillon", tone: "bg-orange-500/15 text-orange-100 border border-orange-400/30" },
  scheduled: { label: "Programmé", tone: "bg-sky-500/15 text-sky-100 border border-sky-400/30" },
};

export default async function FormateurFormationsPage() {
  const formateurCourses = await getFormateurCourses();

  const publishedCount = formateurCourses.filter((course) => course.status === "published").length;
  const draftCount = formateurCourses.filter((course) => course.status === "draft").length;
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <FormateurSidebar activeItem="Formations" />
      <main className="ml-[236px] px-10 py-10">
        <div className="space-y-20 pt-4">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/85 via-slate-900/65 to-slate-950/85 px-6 py-12 md:px-12">
        <div className="pointer-events-none absolute -left-16 top-0 h-72 w-72 rounded-full bg-cyan-400/12 blur-[150px]" aria-hidden="true" />
        <div className="pointer-events-none absolute right-[-14rem] bottom-0 h-96 w-96 rounded-full bg-blue-500/8 blur-[160px]" aria-hidden="true" />
        <div className="relative flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="space-y-8">
            <div className="space-y-3">
              <Badge className="rounded-full border border-cyan-400/30 bg-cyan-500/15 text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-100">
                Bibliothèque formateur
              </Badge>
              <h1 className="max-w-2xl text-3xl font-semibold text-white md:text-[2.5rem] md:leading-[1.1]">
                Un espace créatif, fluide, pour piloter vos formations au quotidien.
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
                Retouchez vos brouillons, finalisez vos parcours et suivez vos formations actives avec une vision claire,
                légère et motivante.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                asChild
                className="rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:scale-[1.02] hover:shadow-cyan-500/35 focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <Link href="/dashboard/formateur/formations/new">Créer une formation</Link>
              </Button>
              <Button
                variant="ghost"
                className="rounded-full border border-white/15 bg-white/8 px-6 py-3 text-sm font-medium text-white/75 transition hover:border-white/25 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30"
              >
                Importer un plan
              </Button>
            </div>
          </div>
          <div className="grid gap-4 text-right text-sm text-white/70">
            <span className="flex items-center justify-end gap-1 text-sm text-white/65">
              <span className="inline-flex items-center gap-1 text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {publishedCount} publiées
              </span>
              ·
              <span className="inline-flex items-center gap-1 text-orange-200">
                <span className="h-2 w-2 rounded-full bg-orange-400" />
                {draftCount} brouillons
              </span>
            </span>
            <span className="text-white/55">Mise à jour {formatDistanceToNow(new Date(), { addSuffix: true, locale: fr })}</span>
          </div>
        </div>
      </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Formations publiées" value={publishedCount} hint="En ligne" tone="from-emerald-500/20 via-emerald-500/10 to-transparent" />
          <StatTile label="Brouillons" value={draftCount} hint="À finaliser" tone="from-orange-500/20 via-orange-500/10 to-transparent" />
          <StatTile label="Apprenants actifs" value={252} hint="Sur vos parcours" tone="from-blue-500/20 via-blue-500/10 to-transparent" />
          <StatTile label="Taux de complétion" value={88} suffix="%" hint="Moyenne 30 jours" tone="from-purple-500/20 via-purple-500/10 to-transparent" />
        </section>

        {formateurCourses.length === 0 ? (
          <Card className="border-white/10 bg-white/5 text-white">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <p className="text-lg font-semibold text-white">Aucune formation disponible</p>
              <p className="max-w-md text-sm text-white/60">
                Créez votre première formation pour commencer à diffuser du contenu auprès de vos apprenants.
              </p>
              <Button
                asChild
                className="rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30"
              >
                <Link href="/dashboard/formateur/formations/new">Créer une formation</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <FormationsCardsClient courses={formateurCourses} statusConfig={statusConfig} />
        )}
        </div>
      </main>
    </div>
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
    <Card className="overflow-hidden rounded-3xl border border-white/8 bg-white/[0.04] backdrop-blur">
      <CardContent className="space-y-5 px-5 py-6">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">{label}</div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-white">{value}</span>
          {suffix ? <span className="text-sm font-semibold text-white/60">{suffix}</span> : null}
        </div>
        {hint ? <p className="text-sm text-white/60">{hint}</p> : null}
        <div className={cn("h-1 w-full rounded-full bg-gradient-to-r", tone)} />
      </CardContent>
    </Card>
  );
}

