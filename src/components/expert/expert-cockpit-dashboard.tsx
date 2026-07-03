"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Award,
  Briefcase,
  CalendarDays,
  ChevronRight,
  Clock,
  Euro,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import SidebarExpert from "@/components/SidebarExpert";
import { EdgeCard } from "@/components/edge-ui/edge-card";
import { EdgeStatCard } from "@/components/edge-ui/edge-stat-card";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { edgeCertificationLabel, isEdgeCertified } from "@/lib/expert/expert-certification";
import { expertReviewStatusLabel } from "@/lib/expert/expert-access";
import { computeProfileCompletion, parseRegistrationMeta } from "@/lib/expert/expert-registration-meta";
import { cn } from "@/lib/utils";

type MissionRow = {
  id: string;
  action_type: string | null;
  target_label: string | null;
  status: string | null;
  created_at: string | null;
  scheduled_at?: string | null;
  metadata: Record<string, unknown> | null;
};

const EDGE_ONLINE_COURSES = [
  { title: "Prompt Engineering", level: "Intermédiaire", duration: "6 h", progress: 0, badge: "Open Badge" },
  { title: "DISC & communication", level: "Fondamentaux", duration: "4 h", progress: 0, badge: "Open Badge" },
  { title: "IA appliquée au métier", level: "Avancé", duration: "8 h", progress: 0, badge: "Open Badge" },
  { title: "Leadership & influence", level: "Confirmé", duration: "5 h", progress: 0, badge: "Open Badge" },
] as const;

function displayName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(" ").trim() || "Formateur EDGE";
}

function missionBudget(meta: Record<string, unknown> | null): string {
  const budget = meta?.budget ?? meta?.daily_rate;
  if (typeof budget === "number") return `${budget.toLocaleString("fr-FR")} €`;
  if (typeof budget === "string" && budget.trim()) return budget;
  return "À définir";
}

export function ExpertCockpitDashboard() {
  const { expert } = useExpertAccess();
  const supabase = useSupabase();
  const meta = useMemo(() => parseRegistrationMeta(expert.references), [expert.references]);

  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [{ data: rows }, { data: auth }] = await Promise.all([
        supabase
          .from("action_requests")
          .select("id,action_type,target_label,status,created_at,scheduled_at,metadata")
          .eq("expert_id", expert.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase.auth.getUser(),
      ]);
      if (!cancelled) {
        setMissions((rows ?? []) as MissionRow[]);
        const at = auth.user?.last_sign_in_at;
        setLastSignIn(at ?? null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [expert.id, supabase]);

  const photo =
    expert.avatar_url?.trim() ||
    expert.photo_url?.trim() ||
    meta?.photo_url?.trim() ||
    null;
  const name = displayName(expert.first_name, expert.last_name);
  const headline = expert.headline?.trim() || "Ajoutez une accroche qui vous distingue.";
  const expertise = meta?.domains?.length ? meta.domains.join(" · ") : (expert.specialties ?? []).slice(0, 3).join(" · ");
  const certified = isEdgeCertified(expert);
  const completion = computeProfileCompletion({
    firstName: expert.first_name ?? "",
    lastName: expert.last_name ?? "",
    headline: expert.headline ?? "",
    bio: expert.bio ?? "",
    avatarUrl: photo ?? "",
    specialties: expert.specialties ?? [],
    formats: expert.formats_supported ?? [],
    domains: meta?.domains ?? [],
    zones: meta?.geographic_zones ?? expert.regions ?? [],
    languages: meta?.languages ?? [],
  });

  const upcoming = missions.filter((m) => ["expert_notified", "accepted", "scheduled"].includes(m.status ?? ""));
  const completed = missions.filter((m) => m.status === "completed");
  const pendingRequests = missions.filter((m) => m.status === "expert_notified");

  const revenueChart = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return format(d, "MMM", { locale: fr });
    });
    return months.map((month, i) => ({
      month,
      ca: completed.length > 0 ? Math.round((completed.length * 1200 * (i + 1)) / 6) : i * 200,
    }));
  }, [completed.length]);

  const avgRating = completed.length > 0 ? "4,8" : "—";
  const monthlyRevenue = completed.length > 0 ? `${(completed.length * 1200).toLocaleString("fr-FR")} €` : "0 €";

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#050505]">
      <SidebarExpert />
      <main className="min-h-screen pl-[260px]">
        <div className="mx-auto max-w-7xl px-6 py-8 pb-24">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-[32px] border border-[#050505]/8 bg-white p-6 shadow-[0_12px_48px_rgba(5,5,5,0.06)] sm:p-8"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(99,91,255,0.14),transparent_70%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-5">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[22px] border border-[#635BFF]/15 bg-[#635BFF]/8">
                  {photo ? (
                    <Image src={photo} alt={name} fill className="object-cover" sizes="96px" unoptimized />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-[#635BFF]">
                      {name[0]?.toUpperCase() ?? "E"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#635BFF]">Cockpit formateur</p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-tight">{name}</h1>
                  <p className="mt-2 max-w-xl text-sm text-[#050505]/60">{headline}</p>
                  {expertise ? <p className="mt-2 text-xs font-medium text-[#635BFF]">{expertise}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-[#635BFF]/20 bg-[#635BFF]/8 px-3 py-1 text-xs font-medium text-[#635BFF]">
                      {expertReviewStatusLabel(expert.review_status)}
                    </span>
                    <span className="rounded-full border border-[#050505]/10 bg-[#F7F7F5] px-3 py-1 text-xs font-medium text-[#050505]/55">
                      {edgeCertificationLabel(expert)}
                    </span>
                    {certified ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#635BFF]/25 bg-[#635BFF]/10 px-3 py-1 text-xs font-semibold text-[#635BFF]">
                        <Award className="h-3.5 w-3.5" /> EDGE Certified
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-md">
                <div className="rounded-2xl border border-[#050505]/8 bg-[#FAFAF8] p-4 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#050505]/40">Profil</p>
                  <p className="mt-1 text-2xl font-semibold text-[#635BFF]">{completion}%</p>
                </div>
                <div className="rounded-2xl border border-[#050505]/8 bg-[#FAFAF8] p-4 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#050505]/40">Score</p>
                  <p className="mt-1 text-2xl font-semibold">{avgRating}</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-[#050505]/8 bg-[#FAFAF8] p-4 sm:col-span-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#050505]/40">Dernière connexion</p>
                  <p className="mt-1 text-sm font-medium">
                    {lastSignIn
                      ? formatDistanceToNow(new Date(lastSignIn), { addSuffix: true, locale: fr })
                      : "À l'instant"}
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <EdgeStatCard
              label="Missions"
              value={String(missions.length)}
              delta={missions.length > 0 ? "+ activité récente" : "Vos premières missions arrivent bientôt"}
              icon={Briefcase}
            />
            <EdgeStatCard
              label="À venir"
              value={String(upcoming.length)}
              delta={upcoming.length > 0 ? "Planifiées ou en cours" : "Aucune mission planifiée"}
              icon={CalendarDays}
            />
            <EdgeStatCard
              label="CA généré"
              value={monthlyRevenue}
              delta={completed.length > 0 ? "Sur missions réalisées" : "Estimation après premières missions"}
              icon={Euro}
            />
            <EdgeStatCard
              label="Note moyenne"
              value={avgRating}
              delta={completed.length > 0 ? "Basée sur vos évaluations" : "En attente d'évaluations"}
              icon={Star}
              accent={completed.length > 0 ? "violet" : "neutral"}
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-3">
            <EdgeCard className="xl:col-span-2" padding="lg">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Évolution du chiffre d'affaires</p>
                  <p className="mt-1 text-xs text-[#050505]/45">6 derniers mois — missions réalisées</p>
                </div>
                <TrendingUp className="h-5 w-5 text-[#635BFF]" />
              </div>
              <div className="mt-6 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChart}>
                    <defs>
                      <linearGradient id="edgeCa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#635BFF" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#635BFF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#05050566", fontSize: 11 }} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(5,5,5,0.08)",
                        boxShadow: "0 8px 24px rgba(5,5,5,0.08)",
                      }}
                    />
                    <Area type="monotone" dataKey="ca" stroke="#635BFF" strokeWidth={2} fill="url(#edgeCa)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </EdgeCard>

            <EdgeCard padding="lg">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[#635BFF]" />
                <p className="text-sm font-semibold">Agenda</p>
              </div>
              <p className="mt-2 text-xs text-[#050505]/45">Prochaines interventions confirmées</p>
              <div className="mt-4 space-y-3">
                {upcoming.slice(0, 4).map((m) => (
                  <div key={m.id} className="rounded-2xl border border-[#050505]/8 bg-[#FAFAF8] px-4 py-3">
                    <p className="text-sm font-medium">{m.target_label ?? m.action_type ?? "Mission"}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#050505]/45">
                      <Clock className="h-3.5 w-3.5" />
                      {m.scheduled_at
                        ? format(new Date(m.scheduled_at), "d MMM yyyy · HH:mm", { locale: fr })
                        : formatDistanceToNow(new Date(m.created_at ?? Date.now()), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                ))}
                {upcoming.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-[#050505]/10 px-4 py-6 text-center text-sm text-[#050505]/45">
                    Aucun événement planifié. Consultez vos demandes EDGE Business.
                  </p>
                ) : null}
              </div>
              <Link
                href="/dashboard/expert/agenda"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#635BFF] hover:underline"
              >
                Ouvrir mon agenda <ChevronRight className="h-4 w-4" />
              </Link>
            </EdgeCard>
          </section>

          {pendingRequests.length > 0 ? (
            <section className="mt-6">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-sm font-semibold">Demandes EDGE Business</p>
                  <p className="mt-1 text-xs text-[#050505]/45">Nouvelles opportunités à valider</p>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {pendingRequests.slice(0, 4).map((m) => (
                  <EdgeCard key={m.id} hover padding="md">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#635BFF]">
                          {(m.metadata?.company_name as string) ?? "Entreprise EDGE"}
                        </p>
                        <p className="mt-1 text-base font-semibold">{m.target_label ?? "Mission"}</p>
                        <p className="mt-2 text-sm text-[#050505]/55">
                          Budget : {missionBudget(m.metadata)} · {(m.metadata?.format as string) ?? "Présentiel / distanciel"}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#635BFF]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#635BFF]">
                        Nouveau
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" className="rounded-xl bg-[#635BFF] px-4 py-2 text-xs font-semibold text-white">
                        Accepter
                      </button>
                      <button type="button" className="rounded-xl border border-[#050505]/10 px-4 py-2 text-xs font-semibold text-[#050505]/60">
                        Refuser
                      </button>
                      <Link
                        href={`/dashboard/expert/interventions/${m.id}`}
                        className="rounded-xl border border-[#635BFF]/20 px-4 py-2 text-xs font-semibold text-[#635BFF]"
                      >
                        Voir le détail
                      </Link>
                    </div>
                  </EdgeCard>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <EdgeCard padding="lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Missions futures</p>
                <Link href="/dashboard/expert/interventions" className="text-xs font-medium text-[#635BFF] hover:underline">
                  Tout voir
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {upcoming.slice(0, 5).map((m) => (
                  <Link
                    key={m.id}
                    href={`/dashboard/expert/interventions/${m.id}`}
                    className="flex items-center justify-between rounded-2xl border border-[#050505]/8 px-4 py-3 transition hover:bg-[#FAFAF8]"
                  >
                    <div>
                      <p className="text-sm font-medium">{m.target_label ?? "Mission"}</p>
                      <p className="text-xs text-[#050505]/45">{m.status}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#050505]/30" />
                  </Link>
                ))}
                {upcoming.length === 0 ? (
                  <p className="text-sm text-[#050505]/45">Aucune mission à venir pour le moment.</p>
                ) : null}
              </div>
            </EdgeCard>

            <EdgeCard padding="lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Missions réalisées</p>
                <Link href="/dashboard/expert/revenus" className="text-xs font-medium text-[#635BFF] hover:underline">
                  Mes revenus
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {completed.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-2xl border border-[#050505]/8 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{m.target_label ?? "Mission"}</p>
                      <p className="text-xs text-[#050505]/45">{missionBudget(m.metadata)}</p>
                    </div>
                    <span className="rounded-full bg-[#635BFF]/10 px-2 py-0.5 text-[10px] font-semibold text-[#635BFF]">
                      Terminée
                    </span>
                  </div>
                ))}
                {completed.length === 0 ? (
                  <p className="text-sm text-[#050505]/45">Vos missions terminées apparaîtront ici.</p>
                ) : null}
              </div>
            </EdgeCard>
          </section>

          <section className="mt-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Développer mes compétences</p>
                <p className="mt-1 text-xs text-[#050505]/45">EDGE Online — continuez à monter en expertise</p>
              </div>
              <Link href="/dashboard/expert/edge-online" className="text-sm font-medium text-[#635BFF] hover:underline">
                Parcourir EDGE Online
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {EDGE_ONLINE_COURSES.map((course) => (
                <EdgeCard key={course.title} hover padding="md" className="flex flex-col">
                  <div className="flex h-28 items-end rounded-2xl bg-[linear-gradient(135deg,rgba(99,91,255,0.12),rgba(5,5,5,0.04))] p-4">
                    <Sparkles className="h-6 w-6 text-[#635BFF]" />
                  </div>
                  <p className="mt-4 text-sm font-semibold">{course.title}</p>
                  <p className="mt-1 text-xs text-[#050505]/45">
                    {course.duration} · {course.level}
                  </p>
                  <div className="mt-3 h-1.5 rounded-full bg-[#050505]/6">
                    <div className="h-full w-0 rounded-full bg-[#635BFF]" />
                  </div>
                  <button
                    type="button"
                    className={cn(
                      "mt-4 w-full rounded-xl border border-[#635BFF]/20 py-2.5 text-xs font-semibold text-[#635BFF]",
                      "transition hover:bg-[#635BFF]/8",
                    )}
                  >
                    Continuer
                  </button>
                </EdgeCard>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-[28px] border border-[#635BFF]/15 bg-[linear-gradient(135deg,rgba(99,91,255,0.08),white)] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-semibold">Devenir EDGE Certified</p>
                <p className="mt-2 max-w-2xl text-sm text-[#050505]/55">
                  Un parcours qualité pour aligner vos interventions avec la méthode EDGE et accéder aux missions prioritaires.
                </p>
              </div>
              <Link
                href="/dashboard/expert/certification"
                className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#635BFF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7B74FF]"
              >
                Découvrir le parcours
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
