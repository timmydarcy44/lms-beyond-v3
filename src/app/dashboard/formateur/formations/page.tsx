import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { FormateurSidebar } from "@/components/formateur/formateur-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMergedFormateurFormationList, type FormateurCourseListItem } from "@/lib/queries/formateur";
import { FormationsCardsClient } from "./formations-cards-client";
import { cn } from "@/lib/utils";
import { UserPlus } from "lucide-react";
import { AssignCourseModal } from "./AssignCourseModal";
import { OpenCourseButton } from "./open-course-button";
import { ToggleCourseStatusButton } from "./toggle-course-status-button";

type FormateurCourse = FormateurCourseListItem;

const statusConfig: Record<FormateurCourse["status"], { label: string; tone: string }> = {
  published: { label: "Publié", tone: "bg-emerald-500/10 text-emerald-200 border border-emerald-500/20" },
  draft: { label: "Brouillon", tone: "bg-orange-500/10 text-orange-200 border border-orange-500/20" },
  scheduled: { label: "Programmé", tone: "bg-sky-500/10 text-sky-200 border border-sky-500/20" },
};

export default async function FormateurFormationsPage() {
  const formateurCourses = await getMergedFormateurFormationList();

  const publishedCount = formateurCourses.filter((course) => course.status === "published").length;
  const draftCount = formateurCourses.filter((course) => course.status === "draft").length;
  const published = formateurCourses.filter((c) => c.status === "published");
  const drafts = formateurCourses.filter((c) => c.status === "draft");
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <FormateurSidebar activeItem="Formations" />
      <main
        className="ml-[228px] border-l border-white/10 px-5 py-8 md:ml-[232px] md:px-6"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(0, 150, 255, 0.05) 0%, rgba(0, 0, 0, 1) 70%)",
        }}
      >
        <div className="space-y-12 pt-2">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b0b0b] via-[#050505] to-[#0d0d0d] px-6 py-10 md:px-10">
        <div className="pointer-events-none absolute -left-16 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-[150px]" aria-hidden="true" />
        <div className="pointer-events-none absolute right-[-14rem] bottom-0 h-96 w-96 rounded-full bg-blue-500/10 blur-[160px]" aria-hidden="true" />
        <div className="relative flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="space-y-8">
            <div className="space-y-3">
              <Badge className="rounded-full border border-cyan-400/20 bg-cyan-500/10 text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-200">
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
                className="rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                <Link href="/dashboard/formateur/formations/new">Créer une formation</Link>
              </Button>
              <Button
                variant="ghost"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/30"
              >
                Importer un plan
              </Button>
            </div>
          </div>
          <div className="grid gap-4 text-right text-sm text-white/70">
            <span className="flex items-center justify-end gap-1 text-sm">
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {publishedCount} publiées
              </span>
              ·
              <span className="inline-flex items-center gap-1 text-orange-300">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                {draftCount} brouillons
              </span>
            </span>
            <span className="text-white/50">Mise à jour {formatDistanceToNow(new Date(), { addSuffix: true, locale: fr })}</span>
          </div>
        </div>
      </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Formations publiées" value={publishedCount} hint="En ligne" tone="from-emerald-500/20 via-emerald-500/10 to-transparent" />
          <StatTile label="Brouillons" value={draftCount} hint="À finaliser" tone="from-orange-500/20 via-orange-500/10 to-transparent" />
          <StatTile label="Apprenants actifs" value={252} hint="Sur vos parcours" tone="from-blue-500/20 via-blue-500/10 to-transparent" />
          <StatTile label="Taux de complétion" value={88} suffix="%" hint="Moyenne 30 jours" tone="from-purple-500/20 via-purple-500/10 to-transparent" />
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-white">Formations en ligne</h2>
              <p className="text-sm text-white/60">Vos formations publiées, visibles par les apprenants.</p>
            </div>
            <Badge className="rounded-full border border-emerald-400/20 bg-emerald-500/10 text-xs font-semibold text-emerald-200">
              {published.length}
            </Badge>
          </div>
          {published.length ? (
            <div className="grid gap-4">
              {published.map((course) => (
                <HorizontalCourseCard key={course.id} course={course} statusTone={statusConfig[course.status].tone} />
              ))}
            </div>
          ) : (
            <Card className="border-white/10 bg-white/5 text-white">
              <CardContent className="py-8 text-sm text-white/60">
                Aucune formation publiée pour l’instant.
              </CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-white">Brouillons</h2>
              <p className="text-sm text-white/60">À finaliser avant publication.</p>
            </div>
            <Badge className="rounded-full border border-orange-400/20 bg-orange-500/10 text-xs font-semibold text-orange-200">
              {drafts.length}
            </Badge>
          </div>
          {drafts.length ? (
            <div className="grid gap-4">
              {drafts.map((course) => (
                <HorizontalCourseCard key={course.id} course={course} statusTone={statusConfig[course.status].tone} />
              ))}
            </div>
          ) : (
            <Card className="border-white/10 bg-white/5 text-white">
              <CardContent className="py-8 text-sm text-white/60">
                Aucun brouillon pour l’instant.
              </CardContent>
            </Card>
          )}
        </section>
        </div>
      </main>
    </div>
  );
}

function HorizontalCourseCard({
  course,
  statusTone,
}: {
  course: FormateurCourse;
  statusTone: string;
}) {
  const isPath = course.source === "path";

  return (
    <Card className="overflow-hidden rounded-3xl border border-white/5 bg-[#0d0d0d] shadow-sm">
      <CardContent className="grid gap-4 p-4 sm:grid-cols-[220px_1fr] sm:items-center">
        <div className="aspect-video overflow-hidden rounded-2xl bg-black/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={course.image}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-white">{course.title}</p>
              <p className="text-sm text-white/60">{course.category}</p>
            </div>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusTone)}>
              {statusConfig[course.status].label}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/60">
            <span>Complétion moyenne: <strong className="text-white">{course.completion}%</strong></span>
            <span className="text-xs text-white/40">
              Mis à jour {formatDistanceToNow(new Date(course.updatedAt), { addSuffix: true, locale: fr })}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isPath ? (
              <Button asChild className="rounded-full bg-[#0A84FF] px-5 py-2 text-sm font-semibold text-white">
                <Link href={`/dashboard/formateur/parcours/${course.id}/edit`}>Ouvrir le parcours</Link>
              </Button>
            ) : (
              <OpenCourseButton courseId={course.id} />
            )}
            <Button asChild variant="ghost" className="rounded-full bg-white/5 px-5 py-2 text-sm font-semibold text-white/80 hover:bg-white/10">
              <Link
                href={
                  isPath
                    ? `/dashboard/formateur/parcours/${course.id}`
                    : `/dashboard/formateur/formations/${course.id}/preview`
                }
              >
                Prévisualiser
              </Link>
            </Button>
            {!isPath ? (
              <>
                <ToggleCourseStatusButton courseId={course.id} currentStatus={course.status} />
                <AssignCourseModal
                  courseId={course.id}
                  courseTitle={course.title}
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Assigner
                    </Button>
                  }
                />
              </>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
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
    <Card className="overflow-hidden rounded-3xl border border-white/5 bg-[#0d0d0d] shadow-sm">
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

