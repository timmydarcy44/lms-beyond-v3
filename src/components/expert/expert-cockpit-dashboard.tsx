"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  ArrowUpRight,
  Award,
  Briefcase,
  CalendarDays,
  ChevronRight,
  Euro,
  MapPin,
  Star,
} from "lucide-react";
import { addHours, format, formatDistanceToNow, parseISO, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import SidebarExpert from "@/components/SidebarExpert";
import { ExpertWeekCalendar, type CalendarEvent } from "@/components/expert/expert-week-calendar";
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

const ONLINE_RECO = [
  { title: "Prompt Engineering", progress: 12, reason: "Aligné avec vos missions IA" },
  { title: "DISC & communication", progress: 0, reason: "Renforce votre posture formateur" },
  { title: "Ingénierie pédagogique", progress: 34, reason: "Pour votre parcours EDGE Certified" },
];

type Props = {
  restricted?: boolean;
};

function firstNameOnly(first?: string | null) {
  return (first ?? "").trim() || "Formateur";
}

function displayName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(" ").trim() || "Formateur EDGE";
}

function missionBudget(meta: Record<string, unknown> | null): string {
  const budget = meta?.budget ?? meta?.daily_rate;
  if (typeof budget === "number") return `${budget.toLocaleString("fr-FR")} €`;
  if (typeof budget === "string" && budget.trim()) return budget;
  return "À définir";
}

function missionLocation(meta: Record<string, unknown> | null): string {
  const loc = meta?.location ?? meta?.city ?? meta?.lieu;
  if (typeof loc === "string" && loc.trim()) return loc;
  return "À préciser";
}

function missionSkills(meta: Record<string, unknown> | null): string[] {
  const skills = meta?.skills ?? meta?.competences;
  if (Array.isArray(skills)) return skills.filter((s): s is string => typeof s === "string");
  return [];
}

export function ExpertCockpitDashboard({ restricted = false }: Props) {
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
          .limit(30),
        supabase.auth.getUser(),
      ]);
      if (!cancelled) {
        setMissions((rows ?? []) as MissionRow[]);
        setLastSignIn(auth.user?.last_sign_in_at ?? null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [expert.id, supabase]);

  const photo = expert.avatar_url?.trim() || expert.photo_url?.trim() || meta?.photo_url?.trim() || null;
  const firstName = firstNameOnly(expert.first_name);
  const name = displayName(expert.first_name, expert.last_name);
  const headline = expert.headline?.trim() || "Complétez votre headline dans Mon profil";
  const certified = isEdgeCertified(expert);
  const certProgress = expert.certification_status === "training" ? 42 : certified ? 100 : expert.wants_certification ? 8 : 0;

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

  const upcoming = missions.filter((m) => ["accepted", "scheduled"].includes(m.status ?? ""));
  const pendingRequests = missions.filter((m) => m.status === "expert_notified");
  const completed = missions.filter((m) => m.status === "completed");

  const revenueChart = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        month: format(d, "MMM", { locale: fr }),
        ca: completed.length > 0 ? Math.round((completed.length * 1400 * (i + 1)) / 6) : 0,
      };
    });
  }, [completed.length]);

  const totalRevenue = completed.length > 0 ? `${(completed.length * 1400).toLocaleString("fr-FR")} €` : "0 €";
  const avgRating = completed.length > 0 ? "4,8" : "—";

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return upcoming
      .map((m) => {
        const start = m.scheduled_at
          ? parseISO(m.scheduled_at)
          : addHours(startOfWeek(new Date(), { weekStartsOn: 1 }), 10 + (missions.indexOf(m) % 5) * 2);
        return {
          id: m.id,
          title: m.target_label ?? "Mission",
          start,
          end: addHours(start, 2),
          location: missionLocation(m.metadata),
        };
      })
      .slice(0, 8);
  }, [upcoming, missions]);

  const handleMissionAction = (id: string, action: "accept" | "reject") => {
    if (restricted) {
      toast.message("Disponible après validation de votre profil.");
      return;
    }
    toast.success(action === "accept" ? "Demande acceptée." : "Demande refusée.");
    setMissions((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: action === "accept" ? "accepted" : "cancelled" } : m,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#050505]">
      <SidebarExpert restricted={restricted} />
      <main className="min-h-screen pl-[260px]">
        <div className="mx-auto max-w-[1400px] px-5 py-6 pb-20 lg:px-8">
          {restricted ? (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#635BFF]/20 bg-[#635BFF]/[0.06] px-4 py-3">
              <p className="text-sm text-[#050505]/70">
                <span className="font-medium text-[#635BFF]">Profil en validation</span> — votre cockpit est
                accessible en lecture. Les actions missions seront débloquées après validation EDGE.
              </p>
              <Link href="/dashboard/expert/profile" className="text-sm font-medium text-[#635BFF] hover:underline">
                Compléter mon profil →
              </Link>
            </div>
          ) : null}

          {/* HERO compact */}
          <header className="flex flex-col gap-5 rounded-[24px] border border-[#050505]/8 bg-white px-5 py-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#635BFF]/15 bg-[#635BFF]/8">
                {photo ? (
                  <Image src={photo} alt={name} fill className="object-cover" sizes="56px" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[#635BFF]">
                    {firstName[0]?.toUpperCase() ?? "E"}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xl font-semibold tracking-tight">
                  Bonjour {firstName},
                </p>
                <p className="text-sm text-[#050505]/55">{headline}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-[#635BFF]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#635BFF]">
                    {expertReviewStatusLabel(expert.review_status)}
                  </span>
                  <span className="rounded-full bg-[#F7F7F5] px-2.5 py-0.5 text-[11px] font-medium text-[#050505]/50">
                    {edgeCertificationLabel(expert)}
                  </span>
                  {certified ? (
                    <span className="rounded-full bg-[#635BFF]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#635BFF]">
                      EDGE Certified
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#050505]/40">Progression profil</p>
                <p className="mt-0.5 text-lg font-semibold text-[#635BFF]">{completion}%</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#050505]/40">Dernière connexion</p>
                <p className="mt-0.5 font-medium">
                  {lastSignIn ? formatDistanceToNow(new Date(lastSignIn), { addSuffix: true, locale: fr }) : "À l'instant"}
                </p>
              </div>
            </div>
          </header>

          {/* KPI */}
          <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <EdgeStatCard label="Missions" value={String(missions.length)} icon={Briefcase} />
            <EdgeStatCard label="CA généré" value={totalRevenue} icon={Euro} />
            <EdgeStatCard
              label="Prochaines interventions"
              value={String(upcoming.length)}
              icon={CalendarDays}
            />
            <EdgeStatCard label="Note moyenne" value={avgRating} icon={Star} accent={completed.length ? "violet" : "neutral"} />
          </section>

          {/* Agenda centre + revenus / certified */}
          <section className="mt-4 grid gap-4 xl:grid-cols-12">
            <EdgeCard className="xl:col-span-8" padding="md">
              <div className="min-h-[420px]">
                <ExpertWeekCalendar
                  events={calendarEvents}
                  onConnectGoogle={() =>
                    toast.message("Connexion Google Agenda — configuration à finaliser.")
                  }
                />
              </div>
            </EdgeCard>

            <div className="flex flex-col gap-4 xl:col-span-4">
              <EdgeCard padding="md" className="flex-1">
                <p className="text-sm font-semibold">Mes revenus</p>
                <p className="mt-1 text-xs text-[#050505]/45">6 derniers mois</p>
                <div className="mt-3 h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChart}>
                      <defs>
                        <linearGradient id="cockpitCa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#635BFF" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#635BFF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#05050566" }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="ca" stroke="#635BFF" strokeWidth={2} fill="url(#cockpitCa)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <Link href="/dashboard/expert/revenus" className="mt-2 inline-flex text-xs font-medium text-[#635BFF] hover:underline">
                  Détail financier →
                </Link>
              </EdgeCard>

              <EdgeCard padding="md">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">EDGE Certified</p>
                  <Award className="h-4 w-4 text-[#635BFF]" />
                </div>
                <p className="mt-2 text-xs text-[#050505]/45">{edgeCertificationLabel(expert)}</p>
                <div className="mt-3 h-2 rounded-full bg-[#050505]/6">
                  <div className="h-full rounded-full bg-[#635BFF]" style={{ width: `${certProgress}%` }} />
                </div>
                <p className="mt-1 text-right text-xs font-medium text-[#635BFF]">{certProgress}%</p>
                <Link
                  href="/dashboard/expert/certification"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[#635BFF]/20 py-2 text-xs font-semibold text-[#635BFF] hover:bg-[#635BFF]/8"
                >
                  Continuer
                </Link>
              </EdgeCard>
            </div>
          </section>

          {/* Demandes EDGE Business */}
          <section className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Demandes EDGE Business</p>
              <span className="text-xs text-[#050505]/40">{pendingRequests.length} en attente</span>
            </div>
            {pendingRequests.length === 0 ? (
              <EdgeCard padding="md" className="text-center text-sm text-[#050505]/45">
                Aucune nouvelle demande pour le moment.
              </EdgeCard>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((m) => {
                  const skills = missionSkills(m.metadata);
                  return (
                    <EdgeCard key={m.id} padding="sm" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#635BFF]">
                          {(m.metadata?.company_name as string) ?? "Entreprise EDGE"}
                        </p>
                        <p className="mt-0.5 font-medium">{m.target_label ?? "Mission"}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#050505]/50">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {missionLocation(m.metadata)}
                          </span>
                          <span>{missionBudget(m.metadata)}</span>
                          <span>
                            {m.scheduled_at
                              ? format(parseISO(m.scheduled_at), "d MMM yyyy", { locale: fr })
                              : "Date à confirmer"}
                          </span>
                        </div>
                        {skills.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {skills.map((s) => (
                              <span key={s} className="rounded-full bg-[#F7F7F5] px-2 py-0.5 text-[10px] text-[#050505]/55">
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={restricted}
                          onClick={() => handleMissionAction(m.id, "accept")}
                          className={cn(
                            "rounded-lg bg-[#635BFF] px-3 py-2 text-xs font-semibold text-white",
                            restricted && "opacity-50",
                          )}
                        >
                          Accepter
                        </button>
                        <button
                          type="button"
                          disabled={restricted}
                          onClick={() => handleMissionAction(m.id, "reject")}
                          className={cn(
                            "rounded-lg border border-[#050505]/10 px-3 py-2 text-xs font-semibold text-[#050505]/60",
                            restricted && "opacity-50",
                          )}
                        >
                          Refuser
                        </button>
                        <Link
                          href={`/dashboard/expert/interventions/${m.id}`}
                          className="rounded-lg border border-[#635BFF]/20 px-3 py-2 text-xs font-semibold text-[#635BFF]"
                        >
                          Voir
                        </Link>
                      </div>
                    </EdgeCard>
                  );
                })}
              </div>
            )}
          </section>

          {/* Prochaines missions + EDGE Online */}
          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            <EdgeCard padding="md">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Mes prochaines missions</p>
                <Link href="/dashboard/expert/interventions" className="text-xs font-medium text-[#635BFF] hover:underline">
                  Tout voir
                </Link>
              </div>
              <div className="mt-3 divide-y divide-[#050505]/6">
                {upcoming.length === 0 ? (
                  <p className="py-6 text-center text-sm text-[#050505]/45">Aucune mission planifiée.</p>
                ) : (
                  upcoming.slice(0, 6).map((m) => (
                    <Link
                      key={m.id}
                      href={`/dashboard/expert/interventions/${m.id}`}
                      className="flex items-center justify-between py-3 transition hover:bg-[#FAFAF8]"
                    >
                      <div>
                        <p className="text-sm font-medium">{m.target_label ?? "Mission"}</p>
                        <p className="text-xs text-[#050505]/45">
                          {(m.metadata?.company_name as string) ?? "Entreprise"} · {missionLocation(m.metadata)}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-[#050505]/25" />
                    </Link>
                  ))
                )}
              </div>
            </EdgeCard>

            <EdgeCard padding="md">
              <p className="text-sm font-semibold">Développez vos compétences</p>
              <p className="mt-1 text-xs text-[#050505]/45">Recommandations EDGE Online personnalisées</p>
              <div className="mt-3 space-y-2">
                {ONLINE_RECO.map((course) => (
                  <div key={course.title} className="rounded-xl border border-[#050505]/8 bg-[#FAFAF8] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{course.title}</p>
                        <p className="mt-0.5 text-[11px] text-[#050505]/45">{course.reason}</p>
                      </div>
                      <Link href="/dashboard/expert/edge-online" className="text-[11px] font-semibold text-[#635BFF]">
                        Continuer
                      </Link>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-[#050505]/6">
                      <div className="h-full rounded-full bg-[#635BFF]" style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </EdgeCard>
          </section>
        </div>
      </main>
    </div>
  );
}
