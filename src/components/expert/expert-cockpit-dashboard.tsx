"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EDGE_ONLINE_EXTERNAL_URL } from "@/lib/training-courses/types";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Bell,
  Briefcase,
  CalendarDays,
  FileText,
  GraduationCap,
  HelpCircle,
  Inbox,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import { addHours, format, parseISO, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import SidebarExpert from "@/components/SidebarExpert";
import type { CalendarEvent } from "@/components/expert/expert-week-calendar";
import { ExpertAgendaStrip } from "@/components/expert/expert-agenda-strip";
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
  { title: "Prompt Engineering", progress: 12, reason: "Aligné avec vos missions IA", icon: Sparkles },
  { title: "DISC & communication", progress: 0, reason: "Renforce votre posture formateur", icon: MessageSquare },
  { title: "Ingénierie pédagogique", progress: 34, reason: "Pour votre parcours Byound Certified", icon: GraduationCap },
];

const QUICK_NAV = [
  { label: "Mon profil", href: "/dashboard/expert/profile", keywords: "profil bio photo" },
  { label: "Mes missions", href: "/dashboard/expert/interventions", keywords: "missions interventions demandes" },
  { label: "Mon agenda", href: "/dashboard/expert/agenda", keywords: "agenda calendrier disponibilités" },
  { label: "Mes revenus", href: "/dashboard/expert/revenus", keywords: "revenus ca factures paiement" },
  { label: "Documents", href: "/dashboard/expert/documents", keywords: "documents contrat supports" },
  { label: "Byound Certified", href: "/dashboard/expert/certification", keywords: "certification badge" },
  { label: "Notifications", href: "/dashboard/expert/notifications", keywords: "notifications alertes" },
  { label: "Paramètres", href: "/dashboard/expert/settings", keywords: "paramètres compte mot de passe" },
  { label: "Centre d'aide", href: "/dashboard/expert/support", keywords: "aide support contact" },
];

type Props = {
  restricted?: boolean;
};

const CARD = "rounded-3xl border border-white/[0.07] bg-[#10173a]/70 backdrop-blur-xl";

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

function splitAmount(value: number) {
  const [int, dec] = value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split(",");
  return { int, dec };
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn(CARD, "flex flex-col justify-between p-5")}>
      <p className="text-xs font-medium text-white/55">{label}</p>
      <p className="mt-6 text-3xl font-semibold tabular-nums tracking-tight text-white">{value}</p>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
  onClick,
  disabled,
}: {
  icon: typeof Plus;
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.1] text-white transition group-hover:bg-white/[0.18]">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="max-w-[80px] text-center text-xs font-medium leading-tight text-white/85">{label}</span>
    </>
  );
  const cls = cn("group flex flex-col items-center gap-2", disabled && "pointer-events-none opacity-40");
  if (href) {
    return (
      <Link href={href} className={cls} aria-disabled={disabled}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function EmptyRow({ icon: Icon, children }: { icon: typeof Inbox; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
        <Icon className="h-4 w-4 text-white/65" />
      </span>
      <p className="text-sm text-white/55">{children}</p>
    </div>
  );
}

export function ExpertCockpitDashboard({ restricted = false }: Props) {
  const { expert } = useExpertAccess();
  const supabase = useSupabase();
  const router = useRouter();
  const meta = useMemo(() => parseRegistrationMeta(expert.references), [expert.references]);

  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [query, setQuery] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: rows } = await supabase
        .from("action_requests")
        .select("id,action_type,target_label,status,created_at,scheduled_at,metadata")
        .eq("expert_id", expert.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!cancelled) setMissions((rows ?? []) as MissionRow[]);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [expert.id, supabase]);

  useEffect(() => {
    if (!moreOpen) return;
    const close = (e: MouseEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [moreOpen]);

  const photo = expert.avatar_url?.trim() || expert.photo_url?.trim() || meta?.photo_url?.trim() || null;
  const firstName = firstNameOnly(expert.first_name);
  const name = displayName(expert.first_name, expert.last_name);
  const headline = expert.headline?.trim() || "Complétez votre titre dans Mon profil";
  const certified = isEdgeCertified(expert);
  const certProgress = expert.certification_status === "training" ? 42 : certified ? 100 : expert.wants_certification ? 8 : 0;
  const certLabel = byoundCertificationLabel(expert);

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

  const revenueTotal = completed.length * 1400;
  const revenueBars = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        month: format(d, "MMM", { locale: fr }).replace(".", ""),
        value: completed.length > 0 ? Math.round((completed.length * 1400 * (i + 1)) / 6) : 0,
      };
    });
  }, [completed.length]);
  const maxBar = Math.max(...revenueBars.map((b) => b.value), 1);

  const avgRating = completed.length > 0 ? "4,8" : "—";
  const amount = splitAmount(revenueTotal);

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return upcoming
      .map((m, i) => {
        const start = m.scheduled_at
          ? parseISO(m.scheduled_at)
          : addHours(startOfWeek(new Date(), { weekStartsOn: 1 }), 10 + (i % 5) * 2);
        return {
          id: m.id,
          title: m.target_label ?? "Mission",
          start,
          end: addHours(start, 2),
          location: missionLocation(m.metadata),
        };
      })
      .slice(0, 12);
  }, [upcoming]);

  const handleMissionAction = (id: string, action: "accept" | "reject") => {
    if (restricted) {
      toast.message("Disponible après validation de votre profil.");
      return;
    }
    toast.success(action === "accept" ? "Demande acceptée." : "Demande refusée.");
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: action === "accept" ? "accepted" : "cancelled" } : m)),
    );
  };

  const searchResults = query.trim()
    ? QUICK_NAV.filter((item) =>
        `${item.label} ${item.keywords}`.toLowerCase().includes(query.trim().toLowerCase()),
      ).slice(0, 5)
    : [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b1f] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-64 left-1/3 h-[760px] w-[900px] rounded-full bg-[radial-gradient(circle_at_center,rgba(91,80,255,0.32),transparent_62%)] blur-3xl" />
        <div className="absolute -right-40 top-0 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_center,rgba(124,90,255,0.22),transparent_62%)] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(40,80,200,0.14),transparent_62%)] blur-3xl" />
      </div>

      <SidebarExpert restricted={restricted} />

      <main className="relative min-h-screen pl-[260px]">
        <div className="mx-auto max-w-[1160px] px-4 pb-20 pt-4 lg:pr-8">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white text-[#070b1f]">
                {photo ? (
                  <Image src={photo} alt={name} fill className="object-cover" sizes="40px" unoptimized />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-semibold">
                    {firstName[0]?.toUpperCase() ?? "E"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold leading-tight">Bonjour {firstName}</p>
                <p className="truncate text-xs text-white/50">{headline}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <form
                className="relative hidden md:block"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchResults[0]) router.push(searchResults[0].href);
                }}
              >
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher"
                  className="h-10 w-[240px] rounded-full bg-white/[0.08] pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/40 focus:bg-white/[0.12]"
                />
                {searchResults.length > 0 ? (
                  <div className="absolute right-0 top-12 z-40 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#121a40] py-1 shadow-2xl">
                    {searchResults.map((r) => (
                      <Link
                        key={r.href}
                        href={r.href}
                        className="block px-4 py-2.5 text-sm text-white/80 hover:bg-white/[0.06] hover:text-white"
                      >
                        {r.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </form>
              <Link
                href="/dashboard/expert/notifications"
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] transition hover:bg-white/[0.14]"
              >
                <Bell className="h-4 w-4" />
                {pendingRequests.length > 0 || restricted ? (
                  <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#7C83FF] ring-2 ring-[#070b1f]" />
                ) : null}
              </Link>
            </div>
          </div>

          {/* Hero balance */}
          <section className="flex flex-col items-center pb-10 pt-8 text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                  restricted ? "bg-amber-400/15 text-amber-200" : "bg-emerald-400/15 text-emerald-200",
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", restricted ? "bg-amber-400" : "bg-emerald-400")} />
                {expertReviewStatusLabel(expert.review_status)}
              </span>
              <span className="rounded-full bg-white/[0.08] px-3 py-1 text-xs font-medium text-white/70">{certLabel}</span>
            </div>
            <p className="mt-6 text-sm font-medium text-white/60">CA généré · EUR</p>
            <p className="mt-1 font-semibold tabular-nums tracking-[-0.04em]">
              <span className="text-[clamp(3.5rem,7vw,5.5rem)] leading-none">{amount.int}</span>
              <span className="text-[clamp(1.75rem,3.5vw,2.75rem)] text-white/90">,{amount.dec} €</span>
            </p>
            <Link
              href="/dashboard/expert/revenus"
              className={cn(
                "mt-5 rounded-full bg-white/[0.1] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.16]",
                restricted && "pointer-events-none opacity-50",
              )}
            >
              Détail financier
            </Link>

            <div className="mt-8 flex items-start justify-center gap-8 sm:gap-10">
              <QuickAction icon={Plus} label="Compléter profil" href="/dashboard/expert/profile" />
              <QuickAction icon={CalendarDays} label="Agenda" href="/dashboard/expert/agenda" disabled={restricted} />
              <QuickAction icon={FileText} label="Documents" href="/dashboard/expert/documents" />
              <div ref={moreRef} className="relative">
                <QuickAction icon={MoreHorizontal} label="Plus" onClick={() => setMoreOpen((v) => !v)} />
                {moreOpen ? (
                  <div className="absolute left-1/2 top-[88px] z-40 w-56 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#121a40] py-1.5 text-left shadow-2xl">
                    {[
                      { label: "Byound Certified", href: "/dashboard/expert/certification", icon: Award },
                      { label: "Byound Online", href: EDGE_ONLINE_EXTERNAL_URL, icon: GraduationCap },
                      { label: "Paramètres", href: "/dashboard/expert/settings", icon: Settings },
                      { label: "Centre d'aide", href: "/dashboard/expert/support", icon: HelpCircle },
                    ].map(({ label, href, icon: Icon }) => (
                      <Link
                        key={label}
                        href={href}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:bg-white/[0.06] hover:text-white"
                      >
                        <Icon className="h-4 w-4 text-white/50" />
                        {label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {/* Profil + stats */}
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.7fr_1fr_1fr_1fr]">
            <Link
              href="/dashboard/expert/profile"
              className="group relative flex items-center gap-5 overflow-hidden rounded-3xl border border-[#7C83FF]/25 bg-gradient-to-br from-[#2a3a8f]/80 via-[#1a2466]/80 to-[#121a45]/80 p-5 md:col-span-2 xl:col-span-1"
            >
              <div
                className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full"
                style={{ background: `conic-gradient(#ffffff ${completion * 3.6}deg, rgba(255,255,255,0.14) 0deg)` }}
              >
                <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#1a2466] text-base font-semibold tabular-nums">
                  {completion}%
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold">{restricted ? "Profil en validation" : "Votre profil expert"}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/60">
                  {restricted
                    ? "Cockpit en lecture seule. Missions, agenda et revenus se débloquent après validation Byound."
                    : "Un profil complet remonte en priorité dans les recherches des entreprises."}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white">
                  Compléter mon profil
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </p>
              </div>
            </Link>
            <StatTile label="Missions" value={String(missions.length)} />
            <StatTile label="Interventions à venir" value={String(upcoming.length)} />
            <StatTile label="Note moyenne" value={avgRating} />
          </section>

          {/* Agenda + revenus / certified */}
          <section className="mt-3 grid gap-3 xl:grid-cols-[1.45fr_1fr]">
            <div className={cn(CARD, "p-5")}>
              <ExpertAgendaStrip
                events={calendarEvents}
                onConnectGoogle={() => toast.message("Connexion Google Agenda — configuration à finaliser.")}
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className={cn(CARD, "flex flex-1 flex-col p-5")}>
                <div className="flex items-start justify-between">
                  <p className="text-lg font-semibold">Mes revenus</p>
                  <span className="text-xs text-white/45">6 derniers mois</span>
                </div>
                <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
                  {revenueTotal.toLocaleString("fr-FR")} €
                </p>
                <div className="mt-auto flex h-28 items-end gap-2 pt-6">
                  {revenueBars.map((bar, i) => {
                    const isLast = i === revenueBars.length - 1;
                    const pct = bar.value > 0 ? Math.max((bar.value / maxBar) * 100, 6) : 0;
                    return (
                      <div key={bar.month} className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-20 w-full items-end">
                          <div
                            className={cn(
                              "w-full rounded-full transition-all",
                              isLast ? "bg-[#9AA0FF] shadow-[0_0_16px_rgba(154,160,255,0.6)]" : "bg-white/15",
                            )}
                            style={{ height: pct > 0 ? `${pct}%` : "4px" }}
                          />
                        </div>
                        <span className={cn("text-[10px]", isLast ? "font-semibold text-white" : "text-white/45")}>
                          {bar.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Link
                  href="/dashboard/expert/revenus"
                  className={cn(
                    "mt-4 inline-flex items-center gap-1 text-xs font-semibold text-white hover:underline",
                    restricted && "pointer-events-none opacity-50",
                  )}
                >
                  Détail financier <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className={cn(CARD, "p-5")}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#070b1f]">
                      <Award className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[15px] font-semibold">Byound Certified</p>
                      <p className="text-xs text-white/50">{certified ? "Actif" : "Non active"}</p>
                    </div>
                  </div>
                  <p className="text-xl font-semibold tabular-nums">{certProgress}%</p>
                </div>
                <div className="mt-4 h-1.5 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#9AA0FF]" style={{ width: `${certProgress}%` }} />
                </div>
                <Link
                  href="/dashboard/expert/certification"
                  className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-white/[0.1] text-sm font-semibold transition hover:bg-white/[0.16]"
                >
                  {certified ? "Voir ma certification" : certProgress > 0 ? "Continuer la certification" : "Démarrer la certification"}
                </Link>
              </div>
            </div>
          </section>

          {/* Demandes + prochaines missions */}
          <section className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className={cn(CARD, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-lg font-semibold">Demandes Byound Business</p>
                <span className="rounded-full bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-white/70">
                  {pendingRequests.length} en attente
                </span>
              </div>
              {pendingRequests.length === 0 ? (
                <EmptyRow icon={Inbox}>Aucune nouvelle demande pour le moment.</EmptyRow>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((m) => {
                    const skills = missionSkills(m.metadata);
                    return (
                      <div key={m.id} className="rounded-2xl bg-white/[0.04] p-4">
                        <p className="text-xs font-medium text-[#A9AEFF]">
                          {(m.metadata?.company_name as string) ?? "Entreprise Byound"}
                        </p>
                        <p className="mt-0.5 text-[15px] font-semibold">{m.target_label ?? "Mission"}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/50">
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
                              <span key={s} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-white/60">
                                {s}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={restricted}
                            onClick={() => handleMissionAction(m.id, "accept")}
                            className="h-9 rounded-full bg-white px-4 text-xs font-semibold text-[#070b1f] disabled:opacity-40"
                          >
                            Accepter
                          </button>
                          <button
                            type="button"
                            disabled={restricted}
                            onClick={() => handleMissionAction(m.id, "reject")}
                            className="h-9 rounded-full bg-white/[0.08] px-4 text-xs font-semibold text-white/80 disabled:opacity-40"
                          >
                            Refuser
                          </button>
                          <Link
                            href={`/dashboard/expert/interventions/${m.id}`}
                            className="ml-auto inline-flex h-9 items-center rounded-full px-3 text-xs font-semibold text-white/70 hover:text-white"
                          >
                            Voir
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={cn(CARD, "p-5")}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-lg font-semibold">Prochaines missions</p>
                <Link href="/dashboard/expert/interventions" className="text-xs font-semibold text-white hover:underline">
                  Tout voir
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <EmptyRow icon={Briefcase}>Aucune mission planifiée.</EmptyRow>
              ) : (
                <div className="space-y-2">
                  {upcoming.slice(0, 5).map((m) => (
                    <Link
                      key={m.id}
                      href={`/dashboard/expert/interventions/${m.id}`}
                      className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.07]"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                        <Briefcase className="h-4 w-4 text-white/65" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{m.target_label ?? "Mission"}</p>
                        <p className="truncate text-xs text-white/45">
                          {(m.metadata?.company_name as string) ?? "Entreprise"} · {missionLocation(m.metadata)}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-white/30" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Byound Online */}
          <section className={cn(CARD, "mt-3 p-5")}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-lg font-semibold">Développez vos compétences</p>
              <span className="text-xs text-white/45">Recommandations Byound Online personnalisées</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {ONLINE_RECO.map(({ title, progress, reason, icon: Icon }) => (
                <a
                  key={title}
                  href={EDGE_ONLINE_EXTERNAL_URL}
                  className="group rounded-2xl bg-white/[0.04] p-4 transition hover:bg-white/[0.07]"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08]">
                      <Icon className="h-4 w-4 text-white/80" />
                    </span>
                    <span className="text-xl font-semibold tabular-nums">{progress}%</span>
                  </div>
                  <p className="mt-4 text-sm font-semibold">{title}</p>
                  <p className="mt-0.5 text-xs text-white/45">{reason}</p>
                  <div className="mt-3 h-1 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#9AA0FF]" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold">
                    Continuer <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </p>
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
