"use client";

import Image from "next/image";
import Link from "next/link";
import { EDGE_ONLINE_EXTERNAL_URL } from "@/lib/training-courses/types";
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
import { useExpertAccess } from "@/components/expert/expert-access-provider";
import { useSupabase } from "@/components/providers/supabase-provider";
import { byoundCertificationLabel, isEdgeCertified } from "@/lib/expert/expert-certification";
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
  { title: "Ingénierie pédagogique", progress: 34, reason: "Pour votre parcours Byound Certified" },
];

type Props = {
  restricted?: boolean;
};

const EXPERT_CARD =
  "rounded-2xl border border-white/[0.08] bg-[#12182b]/90 shadow-[0_24px_80px_rgba(0,0,0,0.25)]";
const EXPERT_MUTED = "text-white/45";

function ExpertStatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Briefcase;
}) {
  return (
    <div className={cn(EXPERT_CARD, "p-4")}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</p>
        <Icon className="h-4 w-4 text-[#3D7BFF]/70" strokeWidth={1.5} />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}

function firstNameOnly(first?: string | null) {
  return (first ?? "").trim() || "Formateur";
}

function displayName(first?: string | null, last?: string | null) {
  return [first, last].filter(Boolean).join(" ").trim() || "Expert Byound";
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

  const certLabel = byoundCertificationLabel(expert);

  return (
    <div className="min-h-screen bg-[#0b0e18] text-white">
      <SidebarExpert restricted={restricted} />
      <main className="min-h-screen pl-[260px]">
        <div className="mx-auto max-w-[1400px] px-5 py-6 pb-20 lg:px-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wider text-white/35">Espace expert</p>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold tabular-nums text-white/90">{totalRevenue.replace(" €", ",00 €")}</p>
              <Link
                href="/dashboard/expert/profile"
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10"
              >
                Compléter profil
              </Link>
              <Link
                href="/dashboard/expert/agenda"
                className={cn(
                  "rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium",
                  restricted ? "pointer-events-none opacity-40" : "bg-white/5 text-white/80 hover:bg-white/10",
                )}
              >
                Agenda
              </Link>
              <Link
                href="/dashboard/expert/documents"
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10"
              >
                Documents
              </Link>
            </div>
          </div>

          {restricted ? (
            <div className={cn("mb-5 flex flex-wrap items-center gap-5 p-5", EXPERT_CARD)}>
              <div
                className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#3D7BFF ${completion * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                }}
              >
                <span className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#0b0e18] text-sm font-bold tabular-nums">
                  {completion}%
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Profil en validation</p>
                <p className={cn("mt-1 text-sm leading-relaxed", EXPERT_MUTED)}>
                  Cockpit en lecture seule. Missions, agenda et revenus se débloquent après validation Byound.
                </p>
              </div>
              <Link
                href="/dashboard/expert/profile"
                className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#0b0e18] hover:bg-white/90"
              >
                Compléter mon profil
              </Link>
            </div>
          ) : null}

          <header className={cn("flex flex-col gap-5 px-5 py-5 lg:flex-row lg:items-center lg:justify-between", EXPERT_CARD)}>
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#3D7BFF]/20 bg-[#3D7BFF]/10">
                {photo ? (
                  <Image src={photo} alt={name} fill className="object-cover" sizes="56px" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[#9EC0FF]">
                    {firstName[0]?.toUpperCase() ?? "E"}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xl font-semibold tracking-tight">Bonjour {firstName},</p>
                <p className={cn("text-sm", EXPERT_MUTED)}>{headline}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {expertReviewStatusLabel(expert.review_status)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-white/55">
                    {certLabel}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Progression profil</p>
                <p className="mt-0.5 text-lg font-semibold text-[#9EC0FF]">{completion}%</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Dernière connexion</p>
                <p className="mt-0.5 font-medium text-white/80">
                  {lastSignIn ? formatDistanceToNow(new Date(lastSignIn), { addSuffix: true, locale: fr }) : "À l'instant"}
                </p>
              </div>
            </div>
          </header>

          <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ExpertStatTile label="Missions" value={String(missions.length)} icon={Briefcase} />
            <ExpertStatTile label="Interventions à venir" value={String(upcoming.length)} icon={CalendarDays} />
            <ExpertStatTile label="CA généré" value={totalRevenue} icon={Euro} />
            <ExpertStatTile label="Note moyenne" value={avgRating} icon={Star} />
          </section>

          {/* Agenda centre + revenus / certified */}
          <section className="mt-4 grid gap-4 xl:grid-cols-12">
            <EdgeCard className={cn("xl:col-span-8", EXPERT_CARD, "shadow-none")} padding="md">
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
              <EdgeCard padding="md" className={cn("flex-1 shadow-none", EXPERT_CARD)}>
                <p className="text-sm font-semibold text-white">Mes revenus</p>
                <p className={cn("mt-1 text-xs", EXPERT_MUTED)}>6 derniers mois</p>
                <div className="mt-3 h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChart}>
                      <defs>
                        <linearGradient id="cockpitCa" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3D7BFF" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#3D7BFF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#ffffff66" }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="ca" stroke="#3D7BFF" strokeWidth={2} fill="url(#cockpitCa)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <Link href="/dashboard/expert/revenus" className="mt-2 inline-flex text-xs font-medium text-[#9EC0FF] hover:underline">
                  Détail financier →
                </Link>
              </EdgeCard>

              <EdgeCard padding="md" className={cn("shadow-none", EXPERT_CARD)}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Byound Certified</p>
                  <Award className="h-4 w-4 text-[#3D7BFF]" />
                </div>
                <p className={cn("mt-2 text-xs", EXPERT_MUTED)}>{certLabel}</p>
                <div className="mt-3 h-2 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#3D7BFF]" style={{ width: `${certProgress}%` }} />
                </div>
                <p className="mt-1 text-right text-xs font-medium text-[#9EC0FF]">{certProgress}%</p>
                <Link
                  href="/dashboard/expert/certification"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[#3D7BFF]/30 py-2 text-xs font-semibold text-[#9EC0FF] hover:bg-[#3D7BFF]/10"
                >
                  Démarrer la certification
                </Link>
              </EdgeCard>
            </div>
          </section>

          <section className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Demandes Byound Business</p>
              <span className={cn("text-xs", EXPERT_MUTED)}>{pendingRequests.length} en attente</span>
            </div>
            {pendingRequests.length === 0 ? (
              <EdgeCard padding="md" className={cn("text-center text-sm shadow-none", EXPERT_CARD, EXPERT_MUTED)}>
                Aucune nouvelle demande
              </EdgeCard>
            ) : (
              <div className="space-y-2">
                {pendingRequests.map((m) => {
                  const skills = missionSkills(m.metadata);
                  return (
                    <EdgeCard
                      key={m.id}
                      padding="sm"
                      className={cn("flex flex-col gap-3 shadow-none lg:flex-row lg:items-center lg:justify-between", EXPERT_CARD)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#9EC0FF]">
                          {(m.metadata?.company_name as string) ?? "Entreprise Byound"}
                        </p>
                        <p className="mt-0.5 font-medium text-white">{m.target_label ?? "Mission"}</p>
                        <div className={cn("mt-2 flex flex-wrap gap-3 text-xs", EXPERT_MUTED)}>
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
                              <span key={s} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/55">
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
                            "rounded-lg bg-[#3D7BFF] px-3 py-2 text-xs font-semibold text-white",
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
                            "rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/60",
                            restricted && "opacity-50",
                          )}
                        >
                          Refuser
                        </button>
                        <Link
                          href={`/dashboard/expert/interventions/${m.id}`}
                          className="rounded-lg border border-[#3D7BFF]/30 px-3 py-2 text-xs font-semibold text-[#9EC0FF]"
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

          {/* Prochaines missions + Byound Online */}
          <section className="mt-4 grid gap-4 lg:grid-cols-2">
            <EdgeCard padding="md" className={cn("shadow-none", EXPERT_CARD)}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Prochaines missions</p>
                <Link href="/dashboard/expert/interventions" className="text-xs font-medium text-[#9EC0FF] hover:underline">
                  Tout voir
                </Link>
              </div>
              <div className="mt-3 divide-y divide-white/[0.06]">
                {upcoming.length === 0 ? (
                  <p className={cn("py-6 text-center text-sm", EXPERT_MUTED)}>Aucune mission planifiée</p>
                ) : (
                  upcoming.slice(0, 6).map((m) => (
                    <Link
                      key={m.id}
                      href={`/dashboard/expert/interventions/${m.id}`}
                      className="flex items-center justify-between py-3 transition hover:bg-white/[0.03]"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{m.target_label ?? "Mission"}</p>
                        <p className={cn("text-xs", EXPERT_MUTED)}>
                          {(m.metadata?.company_name as string) ?? "Entreprise"} · {missionLocation(m.metadata)}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-white/25" />
                    </Link>
                  ))
                )}
              </div>
            </EdgeCard>

            <EdgeCard padding="md" className={cn("shadow-none", EXPERT_CARD)}>
              <p className="text-sm font-semibold text-white">Développez vos compétences</p>
              <p className={cn("mt-1 text-xs", EXPERT_MUTED)}>Recommandations Byound Online</p>
              <div className="mt-3 space-y-2">
                {ONLINE_RECO.map((course) => (
                  <div key={course.title} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-white">{course.title}</p>
                        <p className={cn("mt-0.5 text-[11px]", EXPERT_MUTED)}>{course.reason}</p>
                      </div>
                      <a href={EDGE_ONLINE_EXTERNAL_URL} className="text-[11px] font-semibold text-[#9EC0FF]">
                        Continuer
                      </a>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[#3D7BFF]" style={{ width: `${course.progress}%` }} />
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
