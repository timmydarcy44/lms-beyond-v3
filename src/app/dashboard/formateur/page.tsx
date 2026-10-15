"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, CalendarX, NotebookPen, QrCode } from "lucide-react";

import { JadeDemoGate } from "@/components/demo/jade-demo-gate";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { resolveLearnerDisplayFirstName } from "@/lib/apprenant/display-first-name";
import { cn } from "@/lib/utils";

type Slot = {
  id: string;
  starts_at: string;
  ends_at: string;
  duration_hours?: number;
  module?: { name?: string } | null;
  class?: { name?: string } | null;
};

type Overview = {
  nextSlot: Slot | null;
  upcomingHours: number;
  learnerCount: number;
  journalsPending: number;
  upcoming: Slot[];
};

function formatRange(starts: string, ends: string) {
  const a = new Date(starts);
  const b = new Date(ends);
  const day = a.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const t1 = a.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const t2 = b.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return { day, time: `${t1} — ${t2}` };
}

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export default function FormateurDashboardPage() {
  return (
    <JadeDemoGate space="formateur">
      <FormateurDashboardInner />
    </JadeDemoGate>
  );
}

function FormateurDashboardInner() {
  const [firstName, setFirstName] = useState("Expert");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview>({
    nextSlot: null,
    upcomingHours: 0,
    learnerCount: 0,
    journalsPending: 0,
    upcoming: [],
  });

  useEffect(() => {
    let ignore = false;
    const run = async () => {
      setLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, email")
          .eq("id", user.id)
          .maybeSingle();

        const name = resolveLearnerDisplayFirstName({
          profileFirstName: profile?.first_name,
          email: profile?.email ?? user.email,
        });
        if (!ignore) setFirstName(name || "Expert");

        const [emargementRes, coursesRes, journalRes] = await Promise.all([
          fetch("/api/dashboard/formateur/emargement", { credentials: "include" }),
          fetch("/api/formateur/courses", { credentials: "include" }),
          fetch("/api/dashboard/formateur/cahier-de-texte", { credentials: "include" }),
        ]);

        const emargement = emargementRes.ok ? await emargementRes.json().catch(() => null) : null;
        const coursesPayload = coursesRes.ok ? await coursesRes.json().catch(() => null) : null;
        const journal = journalRes.ok ? await journalRes.json().catch(() => null) : null;

        const slots: Slot[] = Array.isArray(emargement?.slots) ? emargement.slots : [];
        const now = Date.now();
        const future = slots
          .filter((s) => new Date(s.ends_at).getTime() >= now)
          .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
        const next30 = future.filter(
          (s) => new Date(s.starts_at).getTime() <= now + 30 * 86400000,
        );
        const upcomingHours = next30.reduce((a, s) => a + Number(s.duration_hours ?? 0), 0);

        const courses = Array.isArray(coursesPayload?.courses) ? coursesPayload.courses : [];
        const moduleIds = courses.map((c: { id?: string }) => String(c?.id ?? "")).filter(Boolean);
        let learnerCount = 0;
        if (moduleIds.length) {
          const { data: enrollments } = await supabase
            .from("enrollments")
            .select("user_id")
            .in("course_id", moduleIds);
          learnerCount = new Set((enrollments ?? []).map((e: { user_id?: string }) => e.user_id).filter(Boolean)).size;
        }

        const pending = Array.isArray(journal?.sessions)
          ? journal.sessions.filter((s: { lesson_completed_at?: string | null }) => !s.lesson_completed_at).length
          : 0;

        if (!ignore) {
          setOverview({
            nextSlot: future[0] ?? null,
            upcomingHours: Math.round(upcomingHours * 100) / 100,
            learnerCount,
            journalsPending: pending,
            upcoming: future.slice(0, 6),
          });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void run();
    return () => {
      ignore = true;
    };
  }, []);

  const nextMeta = useMemo(() => {
    if (!overview.nextSlot) return null;
    return formatRange(overview.nextSlot.starts_at, overview.nextSlot.ends_at);
  }, [overview.nextSlot]);

  const weekDays = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const hasCourse = overview.upcoming.some((slot) => {
        const slotDate = new Date(slot.starts_at);
        return (
          slotDate.getFullYear() === date.getFullYear() &&
          slotDate.getMonth() === date.getMonth() &&
          slotDate.getDate() === date.getDate()
        );
      });
      const labels = ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"];
      return { date, label: labels[date.getDay()], hasCourse, today: index === 0 };
    });
  }, [overview.upcoming]);

  const actions = [
    { href: "/dashboard/formateur/formations", label: "Mes cours", icon: BookOpen },
    { href: "/dashboard/formateur/emargement", label: "Émargement", icon: QrCode, primary: true },
    { href: "/dashboard/formateur/cahier-de-texte", label: "Cahier de texte", icon: NotebookPen },
    { href: "/dashboard/formateur/planning", label: "Planning", icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      <section className="flex flex-col items-center space-y-6 text-center">
        <div>
          <p className="text-[15px] text-[var(--expert-muted)]">Bonjour {firstName}</p>
          <p className="expert-title mt-2 text-[64px] leading-none tracking-[-0.05em]">
            {loading ? "…" : overview.upcomingHours}
            <span className="ml-2 text-[32px]">h</span>
          </p>
          <p className="expert-muted mt-2 text-[15px]">de cours sur les 30 prochains jours</p>
        </div>
        <div className="flex w-full justify-center gap-4 overflow-x-auto pb-1">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="flex w-[76px] shrink-0 flex-col items-center gap-2">
                <span className={cn("expert-action", action.primary && "is-primary")}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-center text-[12px] font-medium text-[var(--expert-text)]">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="expert-glass lg:col-span-2">
          <p className="expert-kicker">Prochain cours</p>
          {overview.nextSlot && nextMeta ? (
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <p className="expert-title text-[28px]">{overview.nextSlot.module?.name ?? "Séance"}</p>
                <p className="expert-muted text-[14px] capitalize">
                  {isToday(overview.nextSlot.starts_at) ? "Aujourd'hui" : nextMeta.day} · {nextMeta.time}
                </p>
                <p className="text-[14px] text-[var(--expert-text)]">{overview.nextSlot.class?.name ?? "Classe"}</p>
              </div>
              <Link href={`/dashboard/formateur/emargement?slotId=${overview.nextSlot.id}`} className="expert-pill px-5 py-2.5 text-[13px]">
                Ouvrir l&apos;émargement
              </Link>
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-4">
              <span className="expert-icon-tile">
                <CalendarX className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[16px] font-bold">{loading ? "Chargement…" : "Aucun cours planifié"}</p>
                {loading ? null : (
                  <Link href="/dashboard/formateur/planning" className="mt-1 inline-block text-[14px] font-semibold text-[var(--expert-text)]">
                    Voir le planning →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-rows-2">
          <div className="expert-glass h-full">
            <p className="expert-kicker">Apprenants</p>
            <p className="expert-title mt-3 text-[36px] leading-none">{loading ? "…" : overview.learnerCount}</p>
            <p className="expert-muted mt-2 text-[14px]">dans vos classes et formations</p>
          </div>
          <div className="expert-glass h-full">
            <p className="expert-kicker">Cahier de texte</p>
            <div className="mt-3 flex items-center gap-2">
              <p className="expert-title text-[36px] leading-none">{loading ? "…" : overview.journalsPending}</p>
              {!loading && overview.journalsPending > 0 ? <span className="expert-dot" /> : null}
            </div>
            <p className="expert-muted mt-2 text-[14px]">séances à compléter</p>
            <Link href="/dashboard/formateur/cahier-de-texte" className="mt-3 inline-block text-[14px] font-semibold text-[var(--expert-text)]">
              Voir le cahier →
            </Link>
          </div>
        </div>
      </div>

      <section className="expert-glass">
        <div className="flex items-center justify-between gap-3">
          <h2 className="expert-title text-[22px]">Mon planning</h2>
          <Link href="/dashboard/formateur/planning" className="text-[14px] font-semibold text-[var(--expert-text)]">
            Voir tout
          </Link>
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {weekDays.map((day) => (
            <div
              key={`${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`}
              className={cn(
                "flex min-w-[52px] flex-col items-center rounded-2xl px-2 py-2 text-[12px]",
                day.today ? "expert-pill" : "text-[var(--expert-muted)]",
              )}
            >
              <span className="uppercase">{day.label}</span>
              <span className="text-[16px] font-extrabold">{day.date.getDate()}</span>
              <span className={cn("mt-1 h-1.5 w-1.5 rounded-full", day.hasCourse ? "bg-[var(--expert-accent)]" : "bg-transparent")} />
            </div>
          ))}
        </div>
        {overview.upcoming.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 py-6 text-center">
            <span className="expert-icon-tile">
              <CalendarX className="h-5 w-5" />
            </span>
            <p className="expert-muted text-[14px]">
              {loading ? "Chargement du planning…" : "Aucun créneau planifié pour le moment"}
            </p>
            {loading ? null : (
              <Link href="/dashboard/formateur/planning" className="expert-pill-ghost px-5 py-2.5 text-[13px]">
                Ouvrir le planning
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {overview.upcoming.map((slot) => {
              const meta = formatRange(slot.starts_at, slot.ends_at);
              const start = new Date(slot.starts_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={slot.id} className="flex items-center gap-4">
                  <p className="w-14 shrink-0 text-[14px] font-semibold text-[var(--expert-muted)]">{start}</p>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold">{slot.module?.name ?? "Séance"}</p>
                    <p className="expert-muted truncate text-[13px] capitalize">
                      {meta.day}
                      {slot.class?.name ? ` · ${slot.class.name}` : ""}
                    </p>
                  </div>
                  <span className="expert-chip px-3 py-1">{Number(slot.duration_hours ?? 0)} h</span>
                  <Link
                    href={`/dashboard/formateur/cahier-de-texte?slot=${slot.id}`}
                    className="shrink-0 text-[12px] font-semibold text-[var(--expert-text)]"
                  >
                    Cahier
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
