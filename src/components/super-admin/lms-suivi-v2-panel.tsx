"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SuiviLearnerRow, SuiviKpis, SuiviPeriod } from "@/lib/lms/learner-suivi-data";
import { formatDurationCompact } from "@/lib/lms/lms-metrics";

const CARD = "#111831";
const BORDER = "#26304F";
const TEXT = "#F2F4FA";
const MUTED = "#9AA3BD";
const TERT = "#6C7593";
const VIOLET = "#6E5BFF";
const VIOLET_SOFT = "#A99BFF";
const GREEN = "#6BE39B";
const AMBER = "#F2CF6B";
const RED = "#FF8A9B";
const TEAL = "#5EEAD4";

type SortKey = "name" | "progress" | "activity" | "active" | "notes" | "relance";

type Props = {
  initialRows: SuiviLearnerRow[];
  kpis: SuiviKpis;
  courses: Array<{ id: string; title: string }>;
  companies: string[];
};

function avatarGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const a = 200 + (h % 40);
  const b = 120 + ((h >> 5) % 80);
  const c = 180 + ((h >> 10) % 60);
  return `linear-gradient(135deg, hsl(${h % 360} ${a / 4}% ${40 + (h % 20)}%), hsl(${(h + 40) % 360} ${b / 4}% ${35 + (h % 15)}%))`;
}

function initials(name: string, missing: boolean): string {
  if (missing) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeActivity(iso: string | null): { label: string; tone: "green" | "amber" | "red"; title: string } {
  if (!iso) return { label: "jamais connecté", tone: "red", title: "Jamais connecté" };
  const t = Date.parse(iso);
  const title = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date(t));
  const diffMs = Date.now() - t;
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  let label: string;
  if (mins < 60) label = `il y a ${Math.max(1, mins)} min`;
  else if (hours < 24) label = `il y a ${hours} h`;
  else if (days === 1) label = "hier";
  else label = `il y a ${days} j`;
  const tone = days <= 7 ? "green" : days <= 14 ? "amber" : "red";
  return { label, tone, title };
}

function periodLabel(p: SuiviPeriod): string {
  if (p === "7d") return "7 derniers jours";
  if (p === "90d") return "90 derniers jours";
  if (p === "all") return "Depuis le début";
  return "30 derniers jours";
}

export function LmsSuiviV2Panel({ initialRows, kpis, courses, companies }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";
  const filter = searchParams.get("filter") ?? "all";
  const formation = searchParams.get("formation") ?? "";
  const entreprise = searchParams.get("entreprise") ?? "";
  const period = (searchParams.get("period") as SuiviPeriod) || "30d";
  const team = searchParams.get("team") === "1";
  const sort = (searchParams.get("sort") as SortKey) || "relance";
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);

  const [searchDraft, setSearchDraft] = useState(q);

  function setParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      if ("team" in patch || "period" in patch || "formation" in patch || "entreprise" in patch) {
        router.refresh();
      }
    });
  }

  const filtered = useMemo(() => {
    let rows = [...initialRows];
    const query = q.trim().toLowerCase();
    if (query) {
      rows = rows.filter(
        (r) =>
          r.displayName.toLowerCase().includes(query) ||
          r.email.toLowerCase().includes(query) ||
          (r.companyName ?? "").toLowerCase().includes(query),
      );
    }
    if (filter === "relance") rows = rows.filter((r) => r.needsRelance);
    if (formation) rows = rows.filter((r) => r.courseId === formation || r.otherCourses.some((c) => c.id === formation));
    if (entreprise) rows = rows.filter((r) => (r.companyName ?? "") === entreprise);

    rows.sort((a, b) => {
      if (sort === "name") return a.displayName.localeCompare(b.displayName, "fr");
      if (sort === "progress") {
        const pa = a.chaptersTotal ? a.chaptersValidated / a.chaptersTotal : 0;
        const pb = b.chaptersTotal ? b.chaptersValidated / b.chaptersTotal : 0;
        return pb - pa;
      }
      if (sort === "active") return b.activeSeconds - a.activeSeconds;
      if (sort === "notes") return b.notes + b.transformations - (a.notes + a.transformations);
      if (sort === "activity") return (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? "");
      // relance (défaut)
      if (a.needsRelance !== b.needsRelance) return a.needsRelance ? -1 : 1;
      return (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? "");
    });
    return rows;
  }, [initialRows, q, filter, formation, entreprise, sort]);

  const pageSize = 25;
  const pageRows = filtered.slice(0, page * pageSize);
  const hasMore = filtered.length > pageRows.length;

  const sortLabel =
    sort === "name"
      ? "nom"
      : sort === "progress"
        ? "avancement"
        : sort === "active"
          ? "temps actif"
          : sort === "notes"
            ? "notes"
            : sort === "activity"
              ? "dernière activité"
              : "à relancer puis dernière activité";

  function openRelance(row: SuiviLearnerRow) {
    const subject = "On continue ?";
    const chapter = row.currentChapterTitle ? `le chapitre « ${row.currentChapterTitle} »` : "votre parcours";
    const course = row.courseTitle ?? "votre formation";
    const link = row.courseId
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/student/learning?course=${row.courseId}`
      : "";
    const body = `Bonjour${row.nameMissing ? "" : ` ${row.firstName || row.displayName}`},\n\nOn continue ? Vous étiez sur ${course}, ${chapter}.${link ? `\n\nReprendre ici : ${link}` : ""}\n\nÀ bientôt,\nL’équipe Byound`;
    const params = new URLSearchParams({
      to: row.email,
      name: row.displayName,
      subject,
      body,
      learnerId: row.userId,
      relance: "1",
    });
    // Journalisation seule — l’envoi passe par le composeur Resend (manuel).
    // testOnly=true pour les comptes de test : refuse les vrais apprenants si on force le mode test.
    void fetch("/api/super/lms/suivi/relance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        learnerId: row.userId,
        subject,
        courseId: row.courseId,
        leafTitle: row.currentChapterTitle,
        testOnly: row.isTest || looksLikeTestEmail(row.email),
      }),
    });
    router.push(`/super/crm/emails?${params.toString()}`);
  }

  function exportCsv() {
    const params = new URLSearchParams(searchParams.toString());
    window.location.href = `/api/super/lms/suivi/export?${params.toString()}`;
  }

  return (
    <div className="space-y-6" style={{ color: TEXT, fontFamily: "Manrope, system-ui, sans-serif" }}>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[13.5px] font-extrabold" style={{ color: VIOLET_SOFT }}>
            LMS
          </p>
          <h1 className="mt-1 text-[34px] font-extrabold leading-tight tracking-tight">Suivi des apprenants</h1>
          <p className="mt-1.5 text-[14px]" style={{ color: MUTED }}>
            Qui avance, qui décroche, et où en est chacun.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-full border px-4 py-2 text-[13px] font-semibold transition hover:border-[#6E5BFF]/60"
          style={{ borderColor: BORDER, color: TEXT }}
        >
          ⤓ Exporter (CSV)
        </button>
      </header>

      {/* KPIs */}
      <div
        className="grid grid-cols-1 overflow-hidden rounded-[24px] sm:grid-cols-2 xl:grid-cols-4"
        style={{ background: CARD, border: `1px solid ${BORDER}` }}
      >
        <KpiCell
          label="Actifs sur 7 jours"
          value={`${kpis.actifs7j} / ${kpis.total}`}
          sub={`${kpis.inactifs14j} inactifs depuis plus de 14 j`}
          dot={GREEN}
        />
        <KpiCell
          label="Temps actif moyen"
          value={formatDurationCompact(kpis.tempsActifMoyen)}
          sub="par apprenant, sur la période"
          dot={TEAL}
          divider
        />
        <KpiCell
          label="Chapitres validés"
          value={String(kpis.chapitresValides)}
          sub="sur la période"
          dot={VIOLET_SOFT}
          divider
        />
        <KpiCell label="À relancer" value={String(kpis.aRelancer)} sub="inactifs ou jamais connectés" dot={RED} divider />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative">
          <span className="sr-only">Rechercher un apprenant</span>
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setParams({ q: searchDraft || null, page: "1" });
            }}
            onBlur={() => setParams({ q: searchDraft || null, page: "1" })}
            placeholder="⌕ Rechercher un apprenant"
            className="h-10 w-[240px] rounded-full border bg-transparent px-4 text-[13px] outline-none placeholder:text-[#6C7593]"
            style={{ borderColor: BORDER, color: TEXT }}
          />
        </label>

        <Chip active={filter === "all"} onClick={() => setParams({ filter: null, page: "1" })}>
          Tous
        </Chip>
        <Chip active={filter === "relance"} onClick={() => setParams({ filter: "relance", page: "1" })}>
          À relancer ({kpis.aRelancer})
        </Chip>

        <SelectChip
          label={formation ? courses.find((c) => c.id === formation)?.title ?? "Formation" : "Formation"}
          value={formation}
          options={[{ value: "", label: "Toutes" }, ...courses.map((c) => ({ value: c.id, label: c.title }))]}
          onChange={(v) => setParams({ formation: v || null, page: "1" })}
        />
        <SelectChip
          label={entreprise || "Entreprise"}
          value={entreprise}
          options={[{ value: "", label: "Toutes" }, ...companies.map((c) => ({ value: c, label: c }))]}
          onChange={(v) => setParams({ entreprise: v || null, page: "1" })}
        />
        <SelectChip
          label={periodLabel(period)}
          value={period}
          options={[
            { value: "7d", label: "7 derniers jours" },
            { value: "30d", label: "30 derniers jours" },
            { value: "90d", label: "90 derniers jours" },
            { value: "all", label: "Depuis le début" },
          ]}
          onChange={(v) => setParams({ period: v || "30d", page: "1" })}
        />

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={team}
            onClick={() => setParams({ team: team ? null : "1", page: "1" })}
            className="relative h-6 w-11 rounded-full transition"
            style={{ background: team ? VIOLET : BORDER }}
          >
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition"
              style={{ left: team ? 22 : 2 }}
            />
          </button>
          <span className="text-[13px] font-semibold" style={{ color: MUTED }}>
            Équipe et tests ({kpis.hiddenCount})
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[24px]" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        {pending ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl" style={{ background: "#0B1122" }} />
            ))}
          </div>
        ) : (
          <>
            <div
              className="hidden grid-cols-[minmax(0,1.25fr)_minmax(0,1.7fr)_140px_150px_110px_110px] gap-3 px-5 py-3 xl:grid"
              style={{ color: TERT, fontSize: 12.5, fontWeight: 800 }}
            >
              <SortHead label="Apprenant" active={sort === "name"} onClick={() => setParams({ sort: "name" })} />
              <SortHead label="Parcours et avancement" active={sort === "progress"} onClick={() => setParams({ sort: "progress" })} />
              <SortHead label="Dernière activité" active={sort === "activity"} onClick={() => setParams({ sort: "activity" })} />
              <SortHead label="Temps actif · 4 sem." active={sort === "active"} onClick={() => setParams({ sort: "active" })} />
              <SortHead
                label="Notes · transformations"
                active={sort === "notes"}
                onClick={() => setParams({ sort: "notes" })}
                className="hidden min-[1200px]:block"
              />
              <span className="text-right">Action</span>
            </div>

            <ul>
              {pageRows.length === 0 ? (
                <li className="px-5 py-10 text-sm" style={{ color: MUTED }}>
                  Aucun apprenant pour ces filtres.
                </li>
              ) : (
                pageRows.map((row) => (
                  <LearnerRow
                    key={row.userId}
                    row={row}
                    onRelance={() => openRelance(row)}
                    onOpen={() => router.push(`/super/lms/suivi/${row.userId}`)}
                  />
                ))
              )}
            </ul>

            <div
              className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4 text-[12.5px]"
              style={{ borderColor: BORDER, color: TERT }}
            >
              <p>
                {filtered.length} apprenant{filtered.length > 1 ? "s" : ""} · triés par {sortLabel}
                {!team ? " · experts, équipe et comptes de test masqués" : " · équipe et tests affichés"}
              </p>
              {hasMore ? (
                <button
                  type="button"
                  className="font-semibold"
                  style={{ color: VIOLET_SOFT }}
                  onClick={() => setParams({ page: String(page + 1) })}
                >
                  Afficher plus ›
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function looksLikeTestEmail(email: string): boolean {
  const e = email.toLowerCase();
  return e.includes("+test") || e.includes("+demo") || e.includes("demo@") || e.includes("@byound.test");
}

function KpiCell({
  label,
  value,
  sub,
  dot,
  divider,
}: {
  label: string;
  value: string;
  sub: string;
  dot: string;
  divider?: boolean;
}) {
  return (
    <div
      className="px-5 py-5"
      style={divider ? { borderLeft: `1px solid ${BORDER}` } : undefined}
    >
      <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: MUTED }}>
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: dot }} />
        {label}
      </div>
      <p className="mt-2 text-[28px] font-extrabold leading-none">{value}</p>
      <p className="mt-2 text-[12.5px]" style={{ color: TERT }}>
        {sub}
      </p>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 rounded-full border px-3.5 text-[13px] font-semibold"
      style={{
        borderColor: active ? VIOLET : BORDER,
        background: active ? "rgba(110,91,255,0.15)" : "transparent",
        color: TEXT,
      }}
    >
      {children}
    </button>
  );
}

function SelectChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <label className="relative h-10">
      <span
        className="pointer-events-none absolute inset-0 flex items-center rounded-full border px-3.5 text-[13px] font-semibold"
        style={{ borderColor: value ? VIOLET : BORDER, color: TEXT }}
      >
        {label} ▾
      </span>
      <select
        className="h-10 w-full min-w-[140px] cursor-pointer appearance-none opacity-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SortHead({
  label,
  active,
  onClick,
  className,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button type="button" onClick={onClick} className={`text-left ${className ?? ""}`} style={{ color: active ? TEXT : TERT }}>
      {label}
    </button>
  );
}

function LearnerRow({
  row,
  onRelance,
  onOpen,
}: {
  row: SuiviLearnerRow;
  onRelance: () => void;
  onOpen: () => void;
}) {
  const activity = relativeActivity(row.lastActivityAt);
  const progressRatio = row.chaptersTotal > 0 ? Math.min(1, row.chaptersValidated / row.chaptersTotal) : 0;
  const maxBar = Math.max(...row.activeWeekBuckets, 1);

  return (
    <li
      className="grid cursor-pointer grid-cols-1 gap-3 border-t px-5 py-4 transition hover:bg-white/[0.02] xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1.7fr)_140px_150px_110px_110px] xl:items-center"
      style={{ borderColor: BORDER }}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold text-white"
          style={{ background: avatarGradient(row.userId) }}
        >
          {initials(row.displayName, row.nameMissing)}
        </div>
        <div className="min-w-0">
          <p
            className="truncate text-[14.5px] font-extrabold"
            style={{ color: row.nameMissing ? TERT : TEXT }}
          >
            {row.displayName}
          </p>
          {row.nameMissing ? (
            <p className="truncate text-[12px]" style={{ color: TERT }}>
              {row.email}
            </p>
          ) : (
            <p className="truncate text-[12.5px]" style={{ color: MUTED }}>
              {row.roleLabel}
              {row.companyName ? ` · ${row.companyName}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[13.5px] font-semibold">
            {row.courseTitle ?? "Pas encore de parcours"}
            {row.otherCourses.length > 0 ? (
              <span className="ml-2 text-[12px] font-medium" style={{ color: TERT }} title={row.otherCourses.map((c) => c.title).join(", ")}>
                +{row.otherCourses.length} parcours
              </span>
            ) : null}
          </p>
          <span className="shrink-0 text-[13px] font-extrabold">
            {row.chaptersValidated} / {row.chaptersTotal || "—"}
          </span>
        </div>
        <div className="mt-2 h-[6px] overflow-hidden rounded-full" style={{ background: BORDER }}>
          <div className="h-full rounded-full" style={{ width: `${progressRatio * 100}%`, background: VIOLET }} />
        </div>
        <p className="mt-1.5 truncate text-[12.5px]" style={{ color: TERT }}>
          {row.currentChapterTitle ? `En cours : ${row.currentChapterTitle}` : "Pas encore commencé"}
        </p>
      </div>

      <div className="flex items-center gap-2 text-[13px]">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: activity.tone === "green" ? GREEN : activity.tone === "amber" ? AMBER : RED }}
        />
        <span
          title={activity.title}
          style={{ color: activity.label === "jamais connecté" ? RED : TEXT, fontWeight: activity.label === "jamais connecté" ? 700 : 500 }}
        >
          {activity.label}
        </span>
      </div>

      <div className="hidden items-center gap-3 sm:flex">
        <span className="text-[14px] font-extrabold">{row.activeSeconds > 0 ? formatDurationCompact(row.activeSeconds) : "—"}</span>
        <div
          className="hidden h-8 items-end gap-0.5 min-[1200px]:flex"
          title={row.activeWeekBuckets
            .map((s, i) => `S${i + 1}: ${formatDurationCompact(s)}`)
            .join(" · ")}
        >
          {row.activeWeekBuckets.map((s, i) => (
            <span
              key={i}
              className="w-2 rounded-sm"
              style={{
                height: `${Math.max(4, Math.round((s / maxBar) * 28))}px`,
                background: s > 0 ? TEAL : BORDER,
              }}
            />
          ))}
        </div>
      </div>

      <div className="hidden text-[13px] min-[1200px]:block" style={{ color: MUTED }}>
        <span title="Notes Beyond">✎ {row.notes}</span>
        <span className="ml-2" style={{ color: VIOLET_SOFT }} title="Transformations IA">
          ↻ {row.transformations}
        </span>
      </div>

      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        {row.needsRelance ? (
          <button
            type="button"
            onClick={onRelance}
            className="rounded-full px-3.5 py-1.5 text-[13px] font-bold"
            style={{ background: "rgba(255,138,155,0.15)", color: RED }}
          >
            Relancer
          </button>
        ) : (
          <button type="button" onClick={onOpen} className="px-2 text-[18px]" style={{ color: MUTED }}>
            ›
          </button>
        )}
      </div>
    </li>
  );
}
