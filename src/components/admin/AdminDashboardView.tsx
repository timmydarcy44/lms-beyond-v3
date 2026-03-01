"use client";

import { QuickCreateSlider } from "@/components/admin/QuickCreateSlider";
import { KPIGrid, type KpiCard } from "@/components/admin/KPIGrid";
import { ActivityFeed, type ActivityFeedItem } from "@/components/admin/ActivityFeed";
import { TasksBanner } from "@/components/dashboard/tasks-banner";
import type { QualiopiOverview } from "@/lib/queries/admin";
import { MessageCircle, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type AdminDashboardViewProps = {
  kpis: KpiCard[];
  quickItems: Parameters<typeof QuickCreateSlider>[0]["items"];
  activity: ActivityFeedItem[];
  qualiopi: QualiopiOverview;
  firstName?: string | null;
  email?: string | null;
};

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return "0 min";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}min`);
  if (parts.length === 0) parts.push("<1min");
  return parts.join(" ");
};

const formatPercent = (value: number): string => `${Math.round(value)}%`;

const formatScore = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}/100`;
};

const formatRelativeTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return "À l’instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Il y a ${weeks} sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Il y a ${months} mois`;
  const years = Math.floor(days / 365);
  return `Il y a ${years} an${years > 1 ? "s" : ""}`;
};

export const AdminDashboardView = ({
  kpis,
  quickItems,
  activity,
  qualiopi,
  firstName,
  email,
}: AdminDashboardViewProps) => {
  // Utiliser une fonction locale pour extraire le prénom
  const getFirstNameLocal = (fullName: string | null | undefined, email: string | null | undefined): string => {
    if (fullName) {
      const firstName = fullName.trim().split(/\s+/)[0];
      if (firstName) {
        return firstName;
      }
    }
    if (email) {
      const emailPart = email.split("@")[0];
      return emailPart.split(/[._]/)[0];
    }
    return "Admin";
  };

  const firstNameDisplay = getFirstNameLocal(firstName, email);
  const greetingTitle = firstName ? `Bonjour ${firstNameDisplay}` : "Admin Dashboard";
  const hasQualiopiData = qualiopi.groups.length > 0 || qualiopi.learners.length > 0;

  const totalDurationSeconds = qualiopi.learners.reduce(
    (sum, learner) => sum + learner.totalDurationSeconds,
    0,
  );
  const totalActiveSeconds = qualiopi.learners.reduce(
    (sum, learner) => sum + learner.activeDurationSeconds,
    0,
  );
  const averageCompletionRate =
    qualiopi.learners.length > 0
      ? qualiopi.learners.reduce((sum, learner) => sum + learner.averageCompletion, 0) /
        qualiopi.learners.length
      : 0;

  const { testsTakenTotal, weightedScoreTotal } = qualiopi.learners.reduce(
    (acc, learner) => {
      acc.testsTakenTotal += learner.testsTaken;
      if (learner.testsTaken > 0 && learner.testsAverageScore !== null) {
        acc.weightedScoreTotal += learner.testsAverageScore * learner.testsTaken;
      }
      return acc;
    },
    { testsTakenTotal: 0, weightedScoreTotal: 0 },
  );
  const averageScore =
    testsTakenTotal > 0 ? weightedScoreTotal / testsTakenTotal : null;
  const totalBadges = qualiopi.learners.reduce((sum, learner) => sum + learner.badgesCount, 0);

  const topGroup =
    qualiopi.groups.length > 0
      ? [...qualiopi.groups].sort((a, b) => b.averageCompletion - a.averageCompletion)[0]
      : null;

  return (
    <div className="relative flex min-h-screen overflow-x-hidden text-white w-full" style={{ backgroundColor: 'transparent' }}>
      <div className="flex-1 w-full">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-transparent px-5 py-5 backdrop-blur-sm lg:px-8" style={{ border: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="flex items-center gap-3 lg:hidden">
            <div>
              <h1 className="text-xl font-semibold">{greetingTitle}</h1>
              <p className="text-xs text-white/60">Pilotage global</p>
            </div>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-2xl font-semibold">{greetingTitle}</h1>
            <p className="text-sm text-white/60">Supervisez vos formations et vos communautés.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/10/90 px-4 py-2 text-sm text-white/80 backdrop-blur lg:flex">
              <span className="rounded-full bg-gradient-to-tr from-fuchsia-400/30 to-sky-400/40 px-2 py-1 text-xs text-white/90">🔍</span>
              <input
                type="text"
                placeholder="Rechercher…"
                className="w-48 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
              />
            </div>
            <Link
              href="/dashboard/communaute"
              className="flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#8E2DE2,#4A00E0)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_45px_rgba(78,0,224,0.35)] transition hover:scale-105"
            >
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/25 text-white">
                <MessageCircle className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Messagerie
            </Link>
            <Link
              href="/admin"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Paramètres"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </header>
        <main className="space-y-14 px-5 py-10 lg:px-8 w-full max-w-7xl mx-auto overflow-x-hidden">
          <TasksBanner roleFilter="admin" todoHref="/admin/todo" />
          
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#18181b]/90 via-[#11111f]/90 to-[#050505]/80 px-7 py-9 shadow-[0_40px_120px_rgba(59,130,246,0.15)] lg:px-10 lg:py-12">
            <div className="pointer-events-none absolute -left-28 -top-32 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.45),_transparent_70%)] blur-3xl" />
            <div className="pointer-events-none absolute -right-24 bottom-[-160px] h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.35),_transparent_65%)] blur-3xl" />
            <div className="max-w-xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300/90">Pilotage global</p>
              <h2 className="text-3xl font-semibold leading-tight md:text-[34px]">Suivez les performances de vos formations en un coup d'œil.</h2>
              <p className="text-sm text-white/75">
                Déployez de nouveaux parcours, invitez vos formateurs et mesurez l'impact de vos programmes.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button className="rounded-full bg-[linear-gradient(135deg,#8E2DE2,#4A00E0)] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_45px_rgba(78,0,224,0.35)] transition hover:scale-105">
                  Voir tout
                </button>
                <button className="rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10">
                  Rapports
                </button>
              </div>
            </div>
            <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 overflow-hidden rounded-3xl lg:block">
              <Image
                src="https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80"
                alt="Admin analytics"
                width={360}
                height={240}
                className="opacity-90 saturate-125"
              />
            </div>
          </section>

          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#0b1220]/92 via-[#04070d]/92 to-[#010204]/96 px-7 py-9 shadow-[0_45px_140px_-70px_rgba(14,165,233,0.6)] lg:px-10 lg:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_65%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.22),_transparent_60%)]" />
            <div className="relative z-10 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
              <div className="space-y-5">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.38em] text-white/75">
                  Certification Qualiopi
                  <span className="rounded-full bg-emerald-400/25 px-2 py-0.5 text-[10px] font-medium tracking-[0.4em] text-emerald-100">
                    Audit ready
                  </span>
                </span>
                <h3 className="text-3xl font-semibold leading-tight text-white md:text-[36px]">
                  Prouvez votre excellence pédagogique en un clic.
                </h3>
                <p className="max-w-2xl text-sm text-white/75">
                  {hasQualiopiData
                    ? "Consolidez automatiquement le temps de connexion réel, les parcours suivis et la performance de vos groupes pour constituer votre dossier de preuves Qualiopi."
                    : "Centralisez vos futures données d’usage pour alimenter vos indicateurs Qualiopi et garantir la conformité de vos parcours."}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#38bdf8] via-[#0ea5e9] to-[#0f172a] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_20px_70px_-45px_rgba(14,165,233,0.65)] transition hover:scale-[1.03]"
                  >
                    Ouvrir le reporting Qualiopi
                  </Link>
                  <button className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10">
                    Exporter les preuves
                  </button>
                </div>
                {topGroup ? (
                  <div className="mt-4 inline-flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70 sm:flex-row sm:items-center sm:gap-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-emerald-200">
                      Groupe le plus engagé
                    </span>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-white/65">
                      <span className="font-semibold text-white">{topGroup.name}</span>
                      <span>
                        Complétion&nbsp;: <strong className="text-white">{formatPercent(topGroup.averageCompletion)}</strong>
                      </span>
                      <span>
                        Score tests&nbsp;: <strong className="text-white">{formatScore(topGroup.averageScore)}</strong>
                      </span>
                      <span>
                        Actif&nbsp;: <strong className="text-white">{formatDuration(topGroup.activeDurationSeconds)}</strong>
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="grid gap-3 text-sm text-white/75 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/45">Temps connecté cumulé</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{formatDuration(totalDurationSeconds)}</p>
                  <p className="mt-1 text-[11px] text-white/55">
                    Toutes sessions confondues (passif + actif)
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/45">Temps actif déclaré</p>
                  <p className="mt-2 text-2xl font-semibold text-emerald-200">{formatDuration(totalActiveSeconds)}</p>
                  <p className="mt-1 text-[11px] text-white/55">
                    Basé sur les interactions souris/clavier
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/45">Complétion moyenne</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{formatPercent(averageCompletionRate)}</p>
                  <p className="mt-1 text-[11px] text-white/55">Sur l’ensemble des apprenants suivis</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/45">Tests passés</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{testsTakenTotal}</p>
                  <p className="mt-1 text-[11px] text-white/55">
                    Score moyen&nbsp;: <span className="text-white">{formatScore(averageScore)}</span>
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/45">Open badges attribués</p>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="text-2xl font-semibold text-white">{totalBadges}</p>
                    <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] text-white/70">
                      {qualiopi.learners.length} apprenant{qualiopi.learners.length > 1 ? "s" : ""} suivi
                      {qualiopi.learners.length > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <QuickCreateSlider items={quickItems} />

          <KPIGrid kpis={kpis} />

          {hasQualiopiData ? (
            <section className="space-y-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#0f172a]/80 via-[#0a1120]/85 to-[#04060b]/88 px-7 py-8 shadow-[0_32px_120px_-65px_rgba(96,165,250,0.45)] lg:px-10">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Qualiopi</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Traçabilité & performance pédagogique</h3>
                  <p className="mt-1 text-sm text-white/70">
                    Visualisez l’engagement réel de vos groupes et apprenants au regard des exigences Qualiopi.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    {qualiopi.groups.length} groupe{qualiopi.groups.length > 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {qualiopi.learners.length} apprenant{qualiopi.learners.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {qualiopi.groups.length > 0 ? (
                  qualiopi.groups.map((group) => {
                    const topGroupLearners = group.learners.slice(0, 3);
                    return (
                      <div
                        key={group.id}
                        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_-60px_rgba(14,116,144,0.6)] backdrop-blur"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-lg font-semibold text-white">{group.name}</h4>
                            <p className="text-xs text-white/55">
                              {group.memberCount} apprenant{group.memberCount > 1 ? "s" : ""} suivi
                              {group.memberCount > 1 ? "s" : ""}
                            </p>
                          </div>
                          <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-white/65">
                            {formatDuration(group.totalDurationSeconds)}
                          </span>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 text-sm text-white/80 md:grid-cols-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Actif</p>
                            <p className="mt-1 font-semibold text-white">{formatDuration(group.activeDurationSeconds)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Cours suivis</p>
                            <p className="mt-1 font-semibold text-white">{group.coursesFollowed}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Complétion</p>
                            <p className="mt-1 font-semibold text-white">{formatPercent(group.averageCompletion)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Tests</p>
                            <p className="mt-1 font-semibold text-white">{group.testsTaken}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Score moyen</p>
                            <p className="mt-1 font-semibold text-white">{formatScore(group.averageScore)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Open badges</p>
                            <p className="mt-1 font-semibold text-white">{group.badgesCount}</p>
                          </div>
                        </div>
                        {topGroupLearners.length > 0 ? (
                          <div className="mt-5 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                            <p className="font-semibold text-white/80">Apprenants à suivre :</p>
                            <div className="flex flex-wrap gap-2">
                              {topGroupLearners.map((learner) => (
                                <span
                                  key={learner.id}
                                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] text-white/75"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                  {learner.fullName ?? learner.email ?? "Apprenant"}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-white/60">
                    Aucun groupe n’est encore rattaché à votre organisation.
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_24px_80px_-70px_rgba(56,189,248,0.55)]">
                <div className="flex flex-col gap-2 border-b border-white/10 px-6 py-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-xl font-semibold text-white">Apprenants les plus actifs</h4>
                    <p className="text-sm text-white/65">
                      Classement basé sur le temps actif déclaré (mouvements souris & interactions).
                    </p>
                  </div>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
                    Top {Math.min(qualiopi.learners.length, 10)}
                  </span>
                </div>
                {qualiopi.learners.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10 text-sm">
                      <thead>
                        <tr className="text-xs uppercase tracking-[0.3em] text-white/50">
                          <th className="px-6 py-3 text-left">Apprenant</th>
                          <th className="px-6 py-3 text-left">Groupes</th>
                          <th className="px-6 py-3 text-left">Connexion</th>
                          <th className="px-6 py-3 text-left">Actif</th>
                          <th className="px-6 py-3 text-left">Cours</th>
                          <th className="px-6 py-3 text-left">Complétion</th>
                          <th className="px-6 py-3 text-left">Tests</th>
                          <th className="px-6 py-3 text-left">Score</th>
                          <th className="px-6 py-3 text-left">Badges</th>
                          <th className="px-6 py-3 text-left">Dernière activité</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 text-white/80">
                        {[...qualiopi.learners]
                          .sort((a, b) => b.activeDurationSeconds - a.activeDurationSeconds)
                          .slice(0, 10)
                          .map((learner) => (
                            <tr key={learner.id} className="hover:bg-white/5">
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-white">
                                    {learner.fullName ?? learner.email ?? "Apprenant"}
                                  </span>
                                  {learner.email ? (
                                    <span className="text-xs text-white/50">{learner.email}</span>
                                  ) : null}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {learner.groups.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {learner.groups.slice(0, 3).map((group) => (
                                      <span
                                        key={group.id}
                                        className="rounded-full border border-white/15 bg-black/30 px-2.5 py-0.5 text-[11px] text-white/70"
                                      >
                                        {group.name}
                                      </span>
                                    ))}
                                    {learner.groups.length > 3 ? (
                                      <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-0.5 text-[11px] text-white/50">
                                        +{learner.groups.length - 3}
                                      </span>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span className="text-xs text-white/50">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4">{formatDuration(learner.totalDurationSeconds)}</td>
                              <td className="px-6 py-4 text-emerald-300">{formatDuration(learner.activeDurationSeconds)}</td>
                              <td className="px-6 py-4">{learner.coursesFollowed}</td>
                              <td className="px-6 py-4">{formatPercent(learner.averageCompletion)}</td>
                              <td className="px-6 py-4">{learner.testsTaken}</td>
                              <td className="px-6 py-4">{formatScore(learner.testsAverageScore)}</td>
                              <td className="px-6 py-4">{learner.badgesCount}</td>
                              <td className="px-6 py-4 text-white/60">{formatRelativeTime(learner.lastActivityAt)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-10 text-sm text-white/60">
                    Aucun apprenant actif n’a encore été détecté. Invitez vos équipes pour commencer le suivi Qualiopi.
                  </div>
                )}
              </div>
            </section>
          ) : null}

          <ActivityFeed items={activity} />
        </main>
      </div>
    </div>
  );
};


