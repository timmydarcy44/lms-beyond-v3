"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Manrope } from "next/font/google";
import {
  Bell,
  BookOpen,
  ChevronDown,
  Compass,
  GraduationCap,
  LayoutGrid,
  MoreHorizontal,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { listPublicCatalogEntries } from "@/lib/hard-skills/skill-catalog-policy";
import type { EmployeeNextStep } from "@/lib/salarie/employee-next-step";
import { cn } from "@/lib/utils";

const manrope = Manrope({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });

type Home = {
  profile: { firstName: string; lastName: string; initials: string };
  notifications: number | null;
  formation: {
    title: string;
    href: string;
    completed: number;
    total: number;
    percent: number | null;
    nextLeafTitle: string | null;
    complete: boolean;
  } | null;
  bilans: {
    completed: number;
    expected: number;
    disc: { dominant: string; bars: Array<{ key: string; value: number }>; takenAt: string | null } | null;
    idmc: { strong: string; weak: string | null; axes: number[]; takenAt: string | null } | null;
    soft: { top: string[]; flat: boolean; takenAt: string | null } | null;
  };
  skills: { declared: number; withProof: number };
  badges: { count: number; names: string[] };
  analysis: string | null;
  nextStep: EmployeeNextStep;
  history: Array<{
    id: string;
    kind: "coaching" | "intervention" | "bilan" | "demande";
    title: string;
    subtitle: string;
    status: string;
    done: boolean;
    at: string;
  }>;
  visibility: Array<{ id: string; label: string; shared: boolean }>;
  search: Array<{ label: string; href: string }>;
};

type TabId = "formation" | "bilans" | "skills" | "badges";

function formatDate(iso: string | null) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function monthLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const label = date.toLocaleDateString("fr-FR", { month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function SalarieHome() {
  const [home, setHome] = useState<Home | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<TabId | null>(null);
  const [query, setQuery] = useState("");
  const [needOpen, setNeedOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/dashboard/salarie/home", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("home"))))
      .then((json: Home) => {
        if (!cancelled) setHome(json);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const tabs = useMemo(() => {
    if (!home) return [];
    const items: Array<{ id: TabId; label: string }> = [];
    if (home.formation) items.push({ id: "formation", label: "Ma formation" });
    if (home.bilans.completed > 0) items.push({ id: "bilans", label: "Bilans" });
    if (home.skills.declared > 0) items.push({ id: "skills", label: "Compétences" });
    if (home.badges.count > 0) items.push({ id: "badges", label: "Badges" });
    return items;
  }, [home]);

  useEffect(() => {
    if (!tab && tabs[0]) setTab(tabs[0].id);
  }, [tab, tabs]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !home) return [];
    return home.search.filter((item) => item.label.toLowerCase().includes(q)).slice(0, 6);
  }, [home, query]);

  if (error) {
    return (
      <div className={cn(manrope.className, "mx-auto max-w-[980px] px-4 py-16 text-[#F4F5F7]")}>
        <p>Impossible de charger votre espace.</p>
        <button type="button" className="mt-4 h-11 rounded-full bg-white px-5 text-sm font-bold text-[#07080B]" onClick={() => window.location.reload()}>
          Réessayer
        </button>
      </div>
    );
  }

  if (!home) {
    return (
      <div className={cn(manrope.className, "mx-auto max-w-[980px] space-y-4 px-4 py-8")}>
        <div className="h-16 animate-pulse rounded-full bg-[#1E2130]" />
        <div className="h-72 animate-pulse rounded-[36px] bg-[#12141A]" />
      </div>
    );
  }

  const active = tab ?? tabs[0]?.id ?? null;

  return (
    <div className={cn(manrope.className, "mx-auto w-full max-w-[980px] px-4 pb-16 pt-4 text-[#F4F5F7] sm:px-6")}>
      <header className="mb-5 flex items-center gap-3 pl-12 lg:pl-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6E5BFF] text-sm font-extrabold text-white">
          {home.profile.initials}
        </div>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9096A3]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une formation, un bilan..."
            className="h-11 w-full rounded-full border border-[#262A36] bg-[#12141A] pl-11 pr-4 text-sm text-[#F4F5F7] outline-none placeholder:text-[#9096A3] focus:border-[#6E5BFF]"
          />
          {results.length > 0 ? (
            <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[#262A36] bg-[#12141A]">
              {results.map((item) => (
                <li key={item.href + item.label}>
                  <Link href={item.href} className="block px-4 py-3 text-sm hover:bg-[#1E2130]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => setNotifOpen((open) => !open)}
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#262A36] bg-[#12141A]"
        >
          <Bell className="h-4 w-4" />
          {home.notifications ? (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#6E5BFF]" />
          ) : null}
        </button>
      </header>
      {notifOpen ? (
        <p className="mb-4 rounded-2xl border border-[#262A36] bg-[#12141A] px-4 py-3 text-sm text-[#B5BAC6]">
          {home.notifications == null
            ? "Les notifications ne sont pas disponibles."
            : home.notifications === 0
              ? "Aucune notification."
              : `${home.notifications} notification${home.notifications > 1 ? "s" : ""} non lue${home.notifications > 1 ? "s" : ""}.`}
        </p>
      ) : null}

      <section className="relative overflow-hidden rounded-[36px] bg-[#0C0D12] px-5 py-8 text-center sm:px-8">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
          style={{ background: "radial-gradient(60% 100% at 50% 0%, rgba(110,91,255,.45), transparent 70%)" }}
        />
        {tabs.length > 0 ? (
          <div role="tablist" className="relative mx-auto mb-8 flex w-fit flex-wrap justify-center gap-1 rounded-full bg-[#1E2130] p-1">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active === item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "h-9 rounded-full px-4 text-sm font-semibold",
                  active === item.id ? "bg-white text-[#07080B]" : "text-[#B5BAC6]",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="relative text-sm text-[#B5BAC6]">Aucun bilan, formation, compétence ou badge pour le moment.</p>
        )}
        {active === "formation" && home.formation ? (
          <HeroFigure
            legend={home.formation.title}
            value={home.formation.percent != null ? String(home.formation.percent) : "—"}
            unit={home.formation.percent != null ? "%" : ""}
            caption={
              home.formation.total > 0
                ? `${home.formation.completed} sous-chapitres terminés sur ${home.formation.total}`
                : "La progression par sous-chapitre n'est pas encore disponible."
            }
          />
        ) : null}
        {active === "bilans" ? (
          <HeroFigure
            legend="DISC · IDMC · Soft skills"
            value={String(home.bilans.completed)}
            unit={`/ ${home.bilans.expected}`}
            caption="bilans complétés"
          />
        ) : null}
        {active === "skills" ? (
          <HeroFigure
            legend="Compétences déclarées"
            value={String(home.skills.declared)}
            unit=""
            caption={`dont ${home.skills.withProof} avec une preuve déposée`}
          />
        ) : null}
        {active === "badges" ? (
          <HeroFigure
            legend="Open Badges"
            value={String(home.badges.count)}
            unit=""
            caption={
              home.badges.names.slice(0, 2).join(" · ") +
              (home.badges.names.length > 2 ? ` · +${home.badges.names.length - 2}` : "")
            }
          />
        ) : null}

        <div className="relative mt-8 flex flex-wrap items-start justify-center gap-4">
          {home.formation ? (
            <RoundAction href={home.formation.href} label="Ma formation" primary icon={GraduationCap} />
          ) : (
            <RoundAction href="#bilans" label="Bilans" primary icon={Sparkles} />
          )}
          <RoundAction href="/dashboard/salarie/profil" label="Mes compétences" icon={LayoutGrid} />
          <button type="button" onClick={() => setNeedOpen(true)} className="flex w-[88px] flex-col items-center gap-2 text-[13px] font-semibold text-[#DADDE4]">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10"><Compass className="h-5 w-5" /></span>
            Exprimer un besoin
          </button>
          <RoundAction href="/dashboard/salarie/profil" label="Plus" icon={MoreHorizontal} />
        </div>
      </section>

      <NextStepCard step={home.nextStep} onNeed={() => setNeedOpen(true)} />

      <section id="bilans" className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Mes bilans</h2>
          {home.analysis ? (
            <button type="button" onClick={() => setAnalysisOpen(true)} className="text-sm font-semibold text-[#C9C2FF]">
              Synthèse croisée
            </button>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {home.bilans.disc ? (
            <Link href="/dashboard/salarie/test-disc" className="relative min-h-[220px] overflow-hidden rounded-[26px] bg-[#E7782C] p-5 text-white">
              <DatePill date={home.bilans.disc.takenAt} />
              <p className="text-sm font-semibold text-white/80">Dominante</p>
              <p className="mt-2 text-[34px] font-extrabold leading-none">{home.bilans.disc.dominant}</p>
              <div className="mt-8 flex h-10 items-end gap-2">
                {home.bilans.disc.bars.map((bar) => {
                  const max = Math.max(...home.bilans.disc!.bars.map((item) => item.value), 1);
                  const dominant = bar.value === max;
                  return (
                    <div key={bar.key} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded-full bg-white" style={{ height: `${Math.max(8, (bar.value / max) * 28)}px`, opacity: dominant ? 1 : 0.35 }} />
                      <span className="text-[11px] font-bold">{bar.key}</span>
                    </div>
                  );
                })}
              </div>
            </Link>
          ) : null}
          {home.bilans.idmc ? (
            <Link href="/dashboard/salarie/test-idmc" className="relative min-h-[220px] overflow-hidden rounded-[26px] bg-[#2F7CF6] p-5 text-white">
              <DatePill date={home.bilans.idmc.takenAt} />
              <IdmcWatermark values={home.bilans.idmc.axes} />
              <p className="text-sm font-semibold text-white/80">Point fort</p>
              <p className="mt-2 max-w-[220px] text-[26px] font-extrabold leading-tight">{home.bilans.idmc.strong}</p>
              {home.bilans.idmc.weak ? <p className="mt-6 text-sm text-white/85">À renforcer : {home.bilans.idmc.weak}</p> : null}
            </Link>
          ) : null}
          {home.bilans.soft ? (
            <Link href="/soft-skills/resultats?from=salarie" className="relative min-h-[220px] overflow-hidden rounded-[26px] bg-[#14A38B] p-5 text-white">
              <DatePill date={home.bilans.soft.takenAt} />
              <p className="text-sm font-semibold text-white/80">Votre force n°1</p>
              <p className="mt-2 text-[26px] font-extrabold leading-tight">{home.bilans.soft.top[0]}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {home.bilans.soft.top.slice(1).map((label) => (
                  <span key={label} className="rounded-full bg-black/15 px-3 py-1 text-xs font-semibold">{label}</span>
                ))}
              </div>
              {home.bilans.soft.flat ? (
                <p className="mt-4 text-xs text-white/80">Les scores ne départagent pas les compétences : classement seul.</p>
              ) : null}
            </Link>
          ) : null}
        </div>
      </section>

      <section id="accompagnement" className="mt-8 rounded-[28px] bg-[#12141A] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Mon accompagnement</h2>
          <Link href="/dashboard/salarie/missions" className="text-sm font-semibold text-[#C9C2FF]">Tout voir</Link>
        </div>
        {home.history.length === 0 ? (
          <p className="text-sm text-[#B5BAC6]">Votre historique apparaîtra ici.</p>
        ) : (
          <HistoryList items={home.history} />
        )}
      </section>

      <section className="mt-4">
        <button
          type="button"
          aria-expanded={companyOpen}
          onClick={() => setCompanyOpen((open) => !open)}
          className="flex w-full items-center justify-between rounded-[22px] border border-[#262A36] px-5 py-4 text-left"
        >
          <span>
            <span className="block text-sm font-extrabold">Ce que voit votre entreprise</span>
            <span className="mt-1 block text-[13px] text-[#B5BAC6]">
              Vos bilans complétés et votre progression, jamais vos réponses individuelles.
            </span>
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 transition", companyOpen && "rotate-180")} />
        </button>
        {companyOpen ? (
          <ul className="mt-3 space-y-2 px-2 text-sm">
            {home.visibility.map((item) => (
              <li key={item.id} className="flex gap-2 text-[#DADDE4]">
                <span className={item.shared ? "text-[#6BE39B]" : "text-[#9096A3]"}>{item.shared ? "✓" : "×"}</span>
                {item.label}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {analysisOpen && home.analysis ? (
        <dialog open className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setAnalysisOpen(false)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-[28px] bg-[#12141A] p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-extrabold">Synthèse croisée</h3>
              <button type="button" aria-label="Fermer" onClick={() => setAnalysisOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#DADDE4]">{home.analysis}</p>
          </div>
        </dialog>
      ) : null}

      {needOpen ? <NeedModal onClose={() => setNeedOpen(false)} /> : null}
    </div>
  );
}

function HeroFigure({ legend, value, unit, caption }: { legend: string; value: string; unit: string; caption: string }) {
  return (
    <div className="relative">
      <p className="text-sm text-[#DADDE4]">{legend}</p>
      <p className="mt-2 font-extrabold leading-none tracking-[-3px]" style={{ fontSize: "clamp(64px, 8vw, 96px)" }}>
        {value}
        {unit ? <span className="ml-1 text-[0.42em] font-bold tracking-normal text-[#B5BAC6]">{unit}</span> : null}
      </p>
      <p className="mt-2 text-[15px] text-[#DADDE4]">{caption}</p>
    </div>
  );
}

function RoundAction({ href, label, icon: Icon, primary = false }: { href: string; label: string; icon: typeof BookOpen; primary?: boolean }) {
  return (
    <Link href={href} className="flex w-[88px] flex-col items-center gap-2 text-center text-[13px] font-semibold text-[#DADDE4]">
      <span className={cn("flex h-14 w-14 items-center justify-center rounded-full", primary ? "bg-[#6E5BFF]" : "bg-white/10")}>
        <Icon className="h-5 w-5 text-white" />
      </span>
      {label}
    </Link>
  );
}

function DatePill({ date }: { date: string | null }) {
  const label = formatDate(date);
  if (!label) return null;
  return <span className="absolute right-4 top-4 rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-semibold">{label}</span>;
}

function IdmcWatermark({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(values.length, 1) - Math.PI / 2;
    const radius = 28 + (value / max) * 36;
    return `${80 + Math.cos(angle) * radius},${78 + Math.sin(angle) * radius}`;
  });
  return (
    <svg viewBox="0 0 160 150" className="pointer-events-none absolute -right-2 bottom-0 h-36 w-36 opacity-30" aria-hidden>
      <polygon points={points.join(" ")} fill="none" stroke="white" strokeWidth="2" />
    </svg>
  );
}

function NextStepCard({ step, onNeed }: { step: EmployeeNextStep; onNeed: () => void }) {
  if (step.kind === "empty") {
    return (
      <section className="mt-4 rounded-[28px] border border-[#262A36] bg-[#12141A] px-5 py-5 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-extrabold">{step.title}</p>
          <p className="mt-1 text-sm text-[#B5BAC6]">{step.detail}</p>
        </div>
        <button type="button" onClick={onNeed} className="mt-4 inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-bold text-[#07080B] sm:mt-0">
          {step.cta}
        </button>
      </section>
    );
  }
  const inner = (
    <>
      <div>
        <p className="text-[13px] font-semibold text-white/80">{step.kicker}</p>
        <p className="mt-1 text-lg font-extrabold">{step.title}</p>
        {step.detail ? <p className="mt-1 text-sm text-white/80">{step.detail}</p> : null}
      </div>
      <span className="mt-4 inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-bold text-[#07080B] sm:mt-0">{step.cta}</span>
    </>
  );
  const className = "relative mt-4 flex flex-col overflow-hidden rounded-[28px] bg-[#6E5BFF] px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between";
  return step.href ? (
    <Link href={step.href} className={className}>{inner}</Link>
  ) : (
    <section className={className}>{inner}</section>
  );
}

function HistoryList({ items }: { items: Home["history"] }) {
  const groups: Array<{ month: string; rows: Home["history"] }> = [];
  for (const item of items) {
    const month = monthLabel(item.at);
    const last = groups[groups.length - 1];
    if (!last || last.month !== month) groups.push({ month, rows: [item] });
    else last.rows.push(item);
  }
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.month}>
          <p className="mb-2 text-sm font-semibold text-[#B5BAC6]">{group.month}</p>
          <ul>
            {group.rows.map((item) => (
              <li key={item.id} className="flex min-h-16 items-center gap-3 border-t border-[#262A36] py-2">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white",
                    item.kind === "coaching" && "bg-[#6E5BFF]",
                    item.kind === "bilan" && "bg-[#2F7CF6]",
                    item.kind === "demande" && "bg-[#1E2130]",
                    item.kind === "intervention" && "bg-[#1E2130]",
                  )}
                >
                  <BookOpen className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold">{item.title}</span>
                  <span className="block truncate text-[13px] text-[#9096A3]">{item.subtitle}</span>
                </span>
                <span className="text-right">
                  <span className={cn("block text-sm font-extrabold", item.done ? "text-[#6BE39B]" : "text-[#C9C2FF]")}>{item.status}</span>
                  <span className="block text-xs text-[#9096A3]">{formatDate(item.at)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function NeedModal({ onClose }: { onClose: () => void }) {
  const catalog = useMemo(() => listPublicCatalogEntries().map((entry) => entry.name), []);
  const [theme, setTheme] = useState(catalog[0] ?? "autre");
  const [other, setOther] = useState("");
  const [message, setMessage] = useState("");
  const [urgency, setUrgency] = useState<"basse" | "normale">("normale");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const label = theme === "autre" ? other.trim() : theme;
    if (!label) {
      toast.error("Indiquez un thème.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/dashboard/salarie/training-request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, skillId: theme === "autre" ? null : theme, message, urgency }),
      });
      if (!res.ok) throw new Error("send");
      toast.success("Demande envoyée à votre entreprise");
      onClose();
    } catch {
      toast.error("La demande n'a pas pu être envoyée. La table training_requests doit être créée dans Supabase.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center" role="dialog" aria-modal>
      <div className="w-full max-w-lg rounded-[28px] bg-[#12141A] p-6 text-[#F4F5F7]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">Exprimer un besoin</h3>
          <button type="button" aria-label="Fermer" onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <label className="block text-sm text-[#B5BAC6]">
          Thème
          <select value={theme} onChange={(event) => setTheme(event.target.value)} className="mt-1 h-11 w-full rounded-2xl border border-[#262A36] bg-[#07080B] px-3 text-[#F4F5F7]">
            {catalog.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value="autre">Autre</option>
          </select>
        </label>
        {theme === "autre" ? (
          <input value={other} onChange={(event) => setOther(event.target.value)} placeholder="Votre thème" className="mt-3 h-11 w-full rounded-2xl border border-[#262A36] bg-[#07080B] px-3" />
        ) : null}
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message (optionnel)" className="mt-3 min-h-24 w-full rounded-2xl border border-[#262A36] bg-[#07080B] px-3 py-2" />
        <div className="mt-3 flex gap-2">
          {(["basse", "normale"] as const).map((value) => (
            <button key={value} type="button" onClick={() => setUrgency(value)} className={cn("h-10 rounded-full px-4 text-sm font-semibold", urgency === value ? "bg-white text-[#07080B]" : "border border-[#262A36]")}>
              {value === "basse" ? "Basse" : "Normale"}
            </button>
          ))}
        </div>
        <button type="button" disabled={sending} onClick={() => void submit()} className="mt-5 h-11 w-full rounded-full bg-[#6E5BFF] text-sm font-bold text-white disabled:opacity-60">
          {sending ? "Envoi…" : "Envoyer"}
        </button>
      </div>
    </div>
  );
}
