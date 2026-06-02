"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Award,
  BookOpen,
  Brain,
  CalendarDays,
  ChevronRight,
  Users,
  Zap,
} from "lucide-react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { useSupabase } from "@/components/providers/supabase-provider";
import { EmptyState } from "@/components/enterprise/empty-state";

type Overview = {
  configuration_required?: boolean;
  onboarding_href?: string;
  viewer: { email: string | null; prenom: string | null; nom: string | null };
  organisation: { id: string; name: string };
  kpis: {
    employees_total: number;
    diagnostics_completed: number;
    diagnostics_total: number;
    diagnostics_pct: number;
    trainings_in_progress: number;
    attention_signals:
      | { insufficient: true; completed: number; threshold: number }
      | { insufficient: false; attention: number; critical: number };
  };
  this_week: {
    from: string;
    to: string;
    agenda: Array<{ id: string; date: string; time: string; status: string | null }>;
    recent_activity: Array<{ id: string; title: string; at: string; kind?: string }>;
  };
  equipe_insight: {
    week_end: string | null;
    insight: string | null;
    idmc: number | null;
    stress: number | null;
    cohesion: number | null;
    insufficient: boolean;
    completed: number;
    threshold: number;
  };
  collaborators_preview: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    job_title: string | null;
    diagnostic_done: boolean | null;
    idmc_score: number | null;
  }>;
  mobility: { enabled: boolean; completed: number; threshold: number };
};

const AVATAR_COLORS = [
  "bg-purple-500",
  "bg-pink-500",
  "bg-blue-500",
  "bg-orange-500",
  "bg-green-500",
  "bg-red-500",
];

function formatDateLongFr(d = new Date()) {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatRelativeAt(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function initials(first: string | null, last: string | null) {
  const a = (first ?? "").trim().slice(0, 1).toUpperCase();
  const b = (last ?? "").trim().slice(0, 1).toUpperCase();
  return (a + b).trim() || "—";
}

function avatarColor(name: string) {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function idmcColor(score: number | null) {
  if (score == null) return "text-[#9896b8]";
  if (score > 75) return "text-emerald-400";
  if (score > 60) return "text-amber-400";
  return "text-red-400";
}

function GradientKpiCard(props: {
  gradient: string;
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${props.gradient} p-6 text-white shadow-xl`}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10"
        aria-hidden
      />
      <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15">{props.icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{props.label}</p>
          <div className="mt-2 text-3xl font-extrabold tracking-tight">{props.value}</div>
          {props.sub ? <div className="mt-1 text-sm text-white/80">{props.sub}</div> : null}
        </div>
      </div>
      {props.footer ? <div className="relative mt-4">{props.footer}</div> : null}
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className="h-1 w-full rounded-full bg-white/20">
      <div className="h-1 rounded-full bg-white/70 transition-all" style={{ width: `${p}%` }} />
    </div>
  );
}

function activityIcon(kind?: string) {
  if (kind === "badge") return <Award className="h-4 w-4 text-amber-400" />;
  if (kind === "course") return <BookOpen className="h-4 w-4 text-blue-400" />;
  return <Brain className="h-4 w-4 text-violet-400" />;
}

export function EnterpriseDashboardV2() {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const greeting = useMemo(() => {
    const prenom = overview?.viewer?.prenom?.trim();
    if (prenom) return `Bonjour ${prenom}`;
    const email = overview?.viewer?.email?.trim();
    return `Bonjour ${email || "—"}`;
  }, [overview]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userData.user?.id) throw new Error("Non authentifié");

        const res = await fetch("/api/dashboard/entreprise/overview", { credentials: "include" });
        const json = (await res.json()) as Overview & { error?: string };
        if (!res.ok) throw new Error(json.error ?? `Erreur (${res.status})`);
        if (!cancelled) setOverview(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <div className="flex min-h-screen bg-[#0f0e1a] font-sans text-[#f1f0ff]">
      <EnterpriseSidebar />
      <main className="flex-1 bg-gradient-to-b from-[#0f0e1a] to-[#161428] px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#5d5b7a]">Espace Entreprise</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{greeting}</h1>
          <p className="mt-2 text-sm text-[#9896b8]">
            {overview?.organisation?.name ? `${overview.organisation.name} · ` : ""}
            {formatDateLongFr()}
          </p>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#1e1b35] p-6 text-sm text-[#9896b8]">Chargement…</div>
        ) : error ? (
          <EmptyState icon="⚠️" title="Impossible de charger le dashboard" description={error} />
        ) : overview?.configuration_required ? (
          <EmptyState
            icon="⚙️"
            title="Votre espace Beyond est en cours de configuration"
            description="Contactez votre administrateur ou complétez l'onboarding pour activer votre organisation."
            action={{ label: "Continuer l'onboarding →", href: overview.onboarding_href ?? "/onboarding" }}
          />
        ) : overview ? (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <GradientKpiCard
                gradient="from-[#7c3aed] to-[#4f46e5]"
                icon={<Users className="h-6 w-6" />}
                label="Collaborateurs"
                value={overview.kpis.employees_total}
                sub="équipe active"
              />
              <GradientKpiCard
                gradient="from-[#ec4899] to-[#8b5cf6]"
                icon={<Brain className="h-6 w-6" />}
                label="Diagnostics"
                value={`${overview.kpis.diagnostics_completed} / ${overview.kpis.diagnostics_total}`}
                sub={`${overview.kpis.diagnostics_pct}% complétés`}
                footer={<ProgressBar pct={overview.kpis.diagnostics_pct} />}
              />
              <GradientKpiCard
                gradient="from-[#3b82f6] to-[#06b6d4]"
                icon={<BookOpen className="h-6 w-6" />}
                label="Formations en cours"
                value={overview.kpis.trainings_in_progress}
                sub="parcours actifs"
              />
              <GradientKpiCard
                gradient="from-[#f97316] to-[#ef4444]"
                icon={<Zap className="h-6 w-6" />}
                label="Équipe Insight"
                value={
                  overview.kpis.attention_signals.insufficient
                    ? "En attente de données"
                    : overview.kpis.attention_signals.attention
                }
                sub={
                  overview.kpis.attention_signals.insufficient
                    ? `${overview.kpis.attention_signals.completed}/${overview.kpis.attention_signals.threshold} diagnostics`
                    : "signaux cette semaine"
                }
              />
            </section>

            <section className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.06] bg-[#1e1b35] p-5">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-[#a78bfa]" />
                  <p className="text-sm font-semibold text-white">Cette semaine</p>
                </div>
                {overview.this_week.agenda.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState
                      icon="📅"
                      title="Aucun événement cette semaine"
                      description="Planifiez vos premières sessions BCT avec vos collaborateurs."
                      action={{ label: "Planifier des sessions", href: "/dashboard/entreprise/marketplace" }}
                    />
                  </div>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {overview.this_week.agenda.map((a) => (
                      <li key={a.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm">
                        <p className="font-semibold text-white">
                          {a.date} · {a.time}
                        </p>
                        <p className="text-[#9896b8]">Session BCT {a.status ? `— ${a.status}` : ""}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-white/[0.06] bg-[#1e1b35] p-5">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#a78bfa]" />
                  <p className="text-sm font-semibold text-white">Activité récente</p>
                </div>
                {overview.this_week.recent_activity.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState
                      icon="⚡"
                      title="Aucune activité récente"
                      description="Cette section se remplira au fur et à mesure que vos collaborateurs utilisent Beyond."
                    />
                  </div>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {overview.this_week.recent_activity.map((x) => (
                      <li
                        key={x.id}
                        className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm"
                      >
                        <div className="mt-0.5">{activityIcon(x.kind)}</div>
                        <div>
                          <p className="font-semibold text-white">{x.title}</p>
                          <p className="text-[#9896b8]">{formatRelativeAt(x.at)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="mt-10 rounded-2xl border border-white/[0.06] bg-[#1e1b35] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Équipe Insight</p>
                  <p className="mt-1 text-xs text-[#5d5b7a]">Données agrégées et anonymisées — RGPD</p>
                </div>
                <Link
                  href="/dashboard/entreprise/equipe-insight"
                  className="inline-flex items-center text-sm font-semibold text-[#a78bfa] hover:text-[#c4b5fd]"
                >
                  Voir l&apos;analyse complète <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>

              {overview.equipe_insight.insufficient ? (
                <div className="mt-4">
                  <EmptyState
                    icon="🔒"
                    title="Données insuffisantes"
                    description={`Équipe Insight s'active à partir de ${overview.equipe_insight.threshold} diagnostics complétés (${overview.equipe_insight.completed}/${overview.equipe_insight.threshold}).`}
                    action={{ label: "Inviter les collaborateurs →", href: "/dashboard/entreprise/salaries" }}
                  />
                </div>
              ) : (
                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 lg:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#9896b8]">Insight du moment</p>
                    <p className="mt-2 text-sm text-white/80">
                      &ldquo;{overview.equipe_insight.insight ?? "Analyse en cours de génération."}&rdquo;
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#9896b8]">État cognitif</p>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#9896b8]">IDMC</span>
                        <span className="font-semibold">{overview.equipe_insight.idmc ?? "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#9896b8]">Stress</span>
                        <span className="font-semibold">{overview.equipe_insight.stress ?? "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#9896b8]">Cohésion</span>
                        <span className="font-semibold">{overview.equipe_insight.cohesion ?? "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="mt-10 rounded-2xl border border-white/[0.06] bg-[#1e1b35] p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Collaborateurs</p>
                <Link
                  href="/dashboard/entreprise/salaries"
                  className="text-sm font-semibold text-[#a78bfa] hover:text-[#c4b5fd]"
                >
                  Voir tous →
                </Link>
              </div>

              {overview.collaborators_preview.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title="Aucun collaborateur"
                  description="Importez ou invitez vos collaborateurs pour démarrer."
                  action={{ label: "Gérer les collaborateurs →", href: "/dashboard/entreprise/salaries" }}
                />
              ) : (
                <ul className="space-y-2">
                  {overview.collaborators_preview.map((c) => {
                    const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ") || "Collaborateur";
                    const color = avatarColor(fullName);
                    return (
                      <li key={c.id}>
                        <Link
                          href={`/dashboard/entreprise/salaries/${c.id}`}
                          className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition hover:border-[#7c3aed]/30 hover:bg-[#252040]"
                        >
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${color}`}
                          >
                            {initials(c.first_name, c.last_name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-white">{fullName}</p>
                            <p className="truncate text-sm text-[#9896b8]">{c.job_title ?? "—"}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${idmcColor(c.idmc_score)}`}>
                              {c.idmc_score != null ? `${Math.round(c.idmc_score)}%` : "—"}
                            </p>
                            <p className="text-[10px] uppercase tracking-wider text-[#5d5b7a]">IDMC</p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              c.diagnostic_done
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-white/10 text-[#9896b8]"
                            }`}
                          >
                            {c.diagnostic_done ? "Actif" : "En attente"}
                          </span>
                          <ChevronRight className="h-5 w-5 text-[#5d5b7a] transition group-hover:text-[#a78bfa]" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {overview.mobility.enabled ? (
              <section className="mt-10 rounded-2xl border border-[#7c3aed]/20 bg-gradient-to-r from-[#1e1b35] to-[#252040] p-5">
                <p className="text-sm font-semibold text-white">Mobilité interne</p>
                <p className="mt-2 text-sm text-[#9896b8]">
                  Suggestions basées sur les profils cognitifs Beyond (DISC &amp; IDMC).
                </p>
                <Link
                  href="/dashboard/entreprise/equipe-insight"
                  className="mt-4 inline-flex items-center text-sm font-semibold text-[#a78bfa] hover:text-[#c4b5fd]"
                >
                  Voir les suggestions <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </section>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
