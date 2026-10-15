"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  MessageSquare,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { TuteurShell } from "@/components/tuteur/tuteur-shell";
import { TuteurSparkline } from "@/components/tuteur/tuteur-sparkline";
import { useTutorWorkspace } from "@/lib/tuteur/use-tutor-workspace";
import type { TutorWorkspaceAssignment } from "@/lib/tuteur/workspace-server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Users;
  accent: "violet" | "sky" | "amber" | "emerald";
}) {
  const glow =
    accent === "violet"
      ? "from-violet-500/30 to-fuchsia-500/10"
      : accent === "sky"
        ? "from-sky-500/30 to-blue-500/10"
        : accent === "amber"
          ? "from-amber-400/25 to-orange-500/10"
          : "from-emerald-400/25 to-teal-500/10";
  const iconBg =
    accent === "violet"
      ? "from-violet-600/40 to-fuchsia-600/20"
      : accent === "sky"
        ? "from-sky-600/40 to-blue-700/20"
        : accent === "amber"
          ? "from-amber-500/35 to-orange-600/20"
          : "from-emerald-600/35 to-teal-700/20";
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition duration-300",
        "hover:border-white/[0.1] hover:bg-white/[0.045] hover:shadow-[0_20px_50px_-28px_rgba(0,0,0,0.65)]",
      )}
    >
      <div className={cn("pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-40 blur-2xl", glow)} />
      <div className="relative flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br text-white/90 shadow-inner",
            iconBg,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="relative mt-4">
        <div className="text-3xl font-semibold tabular-nums tracking-tight text-white">{value}</div>
        <div className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">{label}</div>
        <p className="mt-2 text-sm leading-snug text-zinc-400">{hint}</p>
      </div>
    </div>
  );
}

function filterAssignments(list: TutorWorkspaceAssignment[], q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return list;
  return list.filter(
    (a) =>
      a.displayName.toLowerCase().includes(s) ||
      (a.ecole ?? "").toLowerCase().includes(s) ||
      (a.email ?? "").toLowerCase().includes(s),
  );
}

export default function TutorDashboardPage() {
  const { data, error, loading } = useTutorWorkspace();
  const [search, setSearch] = useState("");

  const tutorName = data?.tutorName ?? "Tuteur";
  const assignments = data?.assignments ?? [];
  const filtered = useMemo(() => filterAssignments(assignments, search), [assignments, search]);

  const aJour = assignments.filter((a) => a.statut === "a_jour").length;
  const enRetard = assignments.filter((a) => a.statut === "en_retard").length;
  const enCours = assignments.filter((a) => a.statut === "en_cours").length;

  const avgProgress = useMemo(() => {
    const withM = assignments.filter((a) => a.missionsTotal > 0);
    if (!withM.length) return 0;
    return Math.round(
      withM.reduce((sum, a) => sum + (a.missionsValidees / a.missionsTotal) * 100, 0) / withM.length,
    );
  }, [assignments]);

  const statusStyles = (statut: string) => {
    if (statut === "a_jour") return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
    if (statut === "en_retard") return "border-rose-500/25 bg-rose-500/10 text-rose-200";
    return "border-sky-500/25 bg-sky-500/10 text-sky-100";
  };

  const statusLabel = (statut: string) => {
    if (statut === "a_jour") return "À jour";
    if (statut === "en_retard") return "En retard";
    return "En cours";
  };

  const kpis = data?.kpis;
  const pending = data?.pendingMissions ?? [];
  const alerts = data?.alerts ?? [];
  const todoPreview = data?.todoPreview ?? [];

  if (error === "auth") {
    return (
      <TuteurShell tutorName="Tuteur">
        <div className="relative z-10 px-6 py-16 text-center text-zinc-400">
          <p className="text-sm">Cet espace est réservé aux comptes tuteur.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm text-violet-300 hover:text-violet-200">
            Retour au tableau de bord
          </Link>
        </div>
      </TuteurShell>
    );
  }

  return (
    <TuteurShell
      tutorName={tutorName}
      navBadges={{
        missions: kpis?.pendingMissionActions,
      }}
    >
      <div className="relative z-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-4 border-b border-white/[0.06] pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Bonjour {tutorName} <span className="inline-block">👋</span>
            </h1>
            <p className="mt-1 max-w-xl text-sm text-zinc-400">Voici l&apos;état de vos alternants aujourd&apos;hui.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un alternant…"
                className="h-10 rounded-xl border-white/10 bg-black/40 pl-9 text-sm text-white placeholder:text-zinc-600 focus-visible:ring-violet-500/40"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-10 rounded-xl border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
              asChild
            >
              <Link href="/dashboard/student/community" className="inline-flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message
              </Link>
            </Button>
            <Button
              size="sm"
              className="h-10 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-600/80 to-indigo-600/80 text-white shadow-lg shadow-violet-900/20 hover:from-violet-500 hover:to-indigo-500"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Référentiel
            </Button>
          </div>
        </header>

        {loading ? (
          <div className="mt-12 text-center text-sm text-zinc-500">Chargement de votre espace…</div>
        ) : null}

        {!loading && assignments.length === 0 && !error ? (
          <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
            <p className="text-sm text-zinc-300">Aucun alternant n&apos;est encore rattaché à votre compte tuteur.</p>
            <p className="mt-2 text-xs text-zinc-500">
              Un administrateur ou formateur doit créer un rattachement (<code className="text-zinc-400">tutor_assignments</code>
              ).
            </p>
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-8 min-w-0">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Alternants suivis"
                value={String(kpis?.learners ?? 0)}
                hint={`${aJour} à jour · ${enRetard} en retard · ${enCours} en cours`}
                icon={Users}
                accent="violet"
              />
              <KpiCard
                label="Missions en attente"
                value={String(kpis?.pendingMissionActions ?? 0)}
                hint="À valider ou en cours côté alternant"
                icon={ClipboardCheck}
                accent="sky"
              />
              <KpiCard
                label="Évaluations à remplir"
                value={String(kpis?.evaluationsTodo ?? 0)}
                hint="Formulaires de suivi incomplets"
                icon={Sparkles}
                accent="amber"
              />
              <KpiCard
                label="Badges obtenus"
                value={String(kpis?.badgesAwarded ?? 0)}
                hint="Suivi badges (à brancher)"
                icon={Award}
                accent="emerald"
              />
            </div>

            {alerts.length > 0 ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/25 bg-amber-500/10">
                    <AlertTriangle className="h-5 w-5 text-amber-200" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-100">Alertes</p>
                    <ul className="mt-1 space-y-1 text-sm text-amber-100/85">
                      {alerts.map((alert) => (
                        <li key={alert}>{alert}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="shrink-0 self-start text-amber-100 hover:bg-amber-500/10 sm:self-center" asChild>
                  <Link href="/dashboard/tuteur/missions" className="inline-flex items-center gap-1">
                    Voir toutes <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ) : null}

            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">Mes alternants</h2>
                <Link href="/dashboard/tuteur/alternants" className="text-xs font-medium text-violet-300 hover:text-violet-200">
                  Voir tous →
                </Link>
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                {filtered.slice(0, 6).map((alternant, idx) => {
                  const progress = alternant.missionsTotal
                    ? Math.round((alternant.missionsValidees / alternant.missionsTotal) * 100)
                    : 0;
                  const pendingCount = alternant.missionsAValider;
                  return (
                    <Link
                      key={alternant.id}
                      href={`/dashboard/tuteur/alternant/${alternant.id}`}
                      className={cn(
                        "flex flex-col gap-4 p-4 transition duration-200 hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between",
                        idx !== Math.min(filtered.length, 6) - 1 && "border-b border-white/[0.05]",
                      )}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-zinc-700 to-zinc-900 text-sm font-semibold text-white">
                          {alternant.firstName.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{alternant.displayName}</p>
                          <p className="truncate text-xs text-zinc-500">{alternant.ecole ?? "Organisme non renseigné"}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                                statusStyles(alternant.statut),
                              )}
                            >
                              {statusLabel(alternant.statut)}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {alternant.missionsValidees}/{alternant.missionsTotal} missions validées
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-4 sm:gap-6">
                        <div className="text-right">
                          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Progression</div>
                          <div className="text-lg font-semibold tabular-nums text-white">{progress}%</div>
                          <div className="text-xs text-zinc-500">À valider : {pendingCount}</div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zinc-600" />
                      </div>
                    </Link>
                  );
                })}
                {filtered.length === 0 && assignments.length > 0 ? (
                  <div className="p-6 text-center text-sm text-zinc-500">Aucun résultat pour cette recherche.</div>
                ) : null}
              </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
              <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-white">En attente de validation</h2>
                  <Link href="/dashboard/tuteur/missions" className="text-xs text-violet-300 hover:text-violet-200">
                    Voir toutes →
                  </Link>
                </div>
                <div className="space-y-4">
                  {pending.slice(0, 5).map((mission) => (
                    <div
                      key={mission.id}
                      className="rounded-xl border border-white/[0.06] bg-black/30 p-4 transition hover:border-white/10"
                    >
                      <p className="text-sm font-medium text-zinc-100">
                        {mission.learnerName} — {mission.title}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Échéance : {mission.dueDate ?? "—"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/tuteur/missions/${mission.assignmentId}`}
                          className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
                        >
                          Traiter les missions
                        </Link>
                      </div>
                    </div>
                  ))}
                  {pending.length === 0 ? (
                    <p className="text-sm text-zinc-500">Aucune mission en attente de votre action.</p>
                  ) : null}
                </div>
              </section>

              <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-white">Progression globale</h2>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Synthèse
                  </span>
                </div>
                <p className="text-sm text-zinc-500">
                  Progression moyenne des alternants :{" "}
                  <span className="font-semibold text-white">{assignments.length ? `${avgProgress}%` : "—"}</span>
                </p>
                <div className="mt-4 rounded-xl border border-white/[0.05] bg-black/40 p-2">
                  <TuteurSparkline />
                </div>
              </section>
            </div>
          </div>

          <aside className="hidden min-w-0 space-y-4 xl:block">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Alertes</h3>
                {alerts.length > 0 ? (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">{alerts.length}</span>
                ) : null}
              </div>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                {alerts.length ? alerts.slice(0, 4).map((a) => <li key={a}>{a}</li>) : <li className="text-zinc-500">Rien à signaler</li>}
              </ul>
              <Link href="/dashboard/tuteur/missions" className="mt-3 inline-flex text-xs font-medium text-violet-300 hover:text-violet-200">
                Voir les missions →
              </Link>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Mes tâches</h3>
                <Link href="/dashboard/tuteur/todo" className="text-xs text-violet-300 hover:text-violet-200">
                  Ajouter +
                </Link>
              </div>
              <ul className="mt-3 space-y-2.5 text-sm text-zinc-400">
                {todoPreview.length ? (
                  todoPreview.map((task) => (
                    <li key={task.id} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                      <span>{task.title}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-zinc-500">Aucune tâche récente (Kanban).</li>
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="text-sm font-semibold text-white">Activité récente</h3>
              <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                L&apos;historique détaillé (missions, formulaires) est disponible sur la fiche de chaque alternant, onglet
                Historique.
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-8 space-y-4 xl:hidden">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <h3 className="text-sm font-semibold text-white">Alertes &amp; activité</h3>
            <p className="mt-2 text-xs text-zinc-500">Consultez le menu complet sur mobile via l&apos;onglet Menu.</p>
          </div>
        </div>
      </div>
    </TuteurShell>
  );
}
