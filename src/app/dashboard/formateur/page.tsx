"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Clock, NotebookPen, Users } from "lucide-react";

import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
  APPRENANT_CARD_MUTED,
  APPRENANT_CARD_TITLE,
} from "@/lib/apprenant/connect-nav";
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

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-white">
          Bonjour {firstName}
        </h1>
        <p className="text-[14px] text-white/40">Votre espace Expert EDGE</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={APPRENANT_CARD_BODY}>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[#3D7BFF]" />
            <p className={APPRENANT_CARD_KICKER}>Prochain cours</p>
          </div>
          {overview.nextSlot && nextMeta ? (
            <>
              <p className="text-[12px] text-white/45">
                {isToday(overview.nextSlot.starts_at) ? "Aujourd'hui" : nextMeta.day}
              </p>
              <p className={APPRENANT_CARD_TITLE}>{nextMeta.time}</p>
              <p className="text-[14px] font-semibold text-white">
                {overview.nextSlot.module?.name ?? "Séance"}
              </p>
              <p className={APPRENANT_CARD_MUTED}>{overview.nextSlot.class?.name ?? "Classe"}</p>
              <Link
                href={`/dashboard/formateur/emargement?slotId=${overview.nextSlot.id}`}
                className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#3D7BFF] hover:text-[#5B93FF]"
              >
                Ouvrir le cours <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          ) : (
            <p className={cn(APPRENANT_CARD_MUTED, "pt-2")}>
              {loading ? "Chargement…" : "Aucun cours à venir"}
            </p>
          )}
        </div>

        <div className={APPRENANT_CARD_BODY}>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#3D7BFF]" />
            <p className={APPRENANT_CARD_KICKER}>Heures à venir</p>
          </div>
          <p className="text-[32px] font-bold tracking-tight text-white">
            {loading ? "…" : overview.upcomingHours}
            <span className="ml-1 text-[16px] font-semibold text-white/40">h</span>
          </p>
          <p className={APPRENANT_CARD_MUTED}>sur les 30 prochains jours</p>
        </div>

        <div className={APPRENANT_CARD_BODY}>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#3D7BFF]" />
            <p className={APPRENANT_CARD_KICKER}>Apprenants</p>
          </div>
          <p className="text-[32px] font-bold tracking-tight text-white">
            {loading ? "…" : overview.learnerCount}
          </p>
          <p className={APPRENANT_CARD_MUTED}>dans vos classes / formations</p>
        </div>

        <div className={APPRENANT_CARD_BODY}>
          <div className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-[#3D7BFF]" />
            <p className={APPRENANT_CARD_KICKER}>Cahier de texte</p>
          </div>
          <p className="text-[32px] font-bold tracking-tight text-white">
            {loading ? "…" : overview.journalsPending}
          </p>
          <p className={APPRENANT_CARD_MUTED}>séances à compléter</p>
          <Link
            href="/dashboard/formateur/cahier-de-texte"
            className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#3D7BFF] hover:text-[#5B93FF]"
          >
            Voir le cahier <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-white/90">Mon planning</h2>
          <Link
            href="/dashboard/formateur/planning"
            className="text-[12px] font-semibold text-white/40 hover:text-white"
          >
            Voir tout
          </Link>
        </div>
        {overview.upcoming.length === 0 ? (
          <p className={cn(APPRENANT_CARD_MUTED, "py-4")}>
            {loading ? "Chargement du planning…" : "Aucun créneau planifié pour le moment."}
          </p>
        ) : (
          <div className="space-y-2">
            {overview.upcoming.map((slot) => {
              const meta = formatRange(slot.starts_at, slot.ends_at);
              return (
                <div key={slot.id} className={cn(APPRENANT_CARD_BODY, "flex-row items-center justify-between gap-4")}>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[12px] capitalize text-white/40">{meta.day}</p>
                    <p className="text-[14px] font-semibold text-white">{meta.time}</p>
                    <p className="truncate text-[13px] text-white/70">
                      {slot.module?.name ?? "Séance"}
                      {slot.class?.name ? ` · ${slot.class.name}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-semibold text-[#3D7BFF]">
                      {Number(slot.duration_hours ?? 0)} h
                    </p>
                    <Link
                      href={`/dashboard/formateur/cahier-de-texte?slot=${slot.id}`}
                      className="text-[11px] font-medium text-white/40 hover:text-white"
                    >
                      Cahier
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/formateur/formations"
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-[13px] font-semibold text-white/70 transition hover:border-[#3D7BFF]/30 hover:text-white"
        >
          <BookOpen className="h-4 w-4 text-[#3D7BFF]" />
          Mes cours
        </Link>
        <Link
          href="/dashboard/formateur/emargement"
          className="inline-flex items-center gap-2 rounded-xl bg-[#3D7BFF] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#5B93FF]"
        >
          Émargement
        </Link>
      </section>
    </div>
  );
}
