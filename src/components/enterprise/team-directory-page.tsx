"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Manrope } from "next/font/google";
import {
  Award,
  Briefcase,
  ChevronRight,
  GraduationCap,
  MoreHorizontal,
  Plus,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { EnterpriseEmployeeCsvActions } from "@/components/enterprise/enterprise-employee-csv-actions";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useEntrepriseOverview } from "@/hooks/use-entreprise-overview";
import { filterRealEntrepriseEmployees } from "@/lib/entreprise/demo-employee-id";
import { JADE_ENTREPRISE_OFFERS, JADE_ORG_COURSES } from "@/lib/demo/jade-dashboard-mocks";
import type { EntrepriseEmployee } from "@/lib/entreprise/overview-types";
import { cn } from "@/lib/utils";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const VIEW_KEY = "byound-business-team-view";

type ViewMode = "liste" | "tableau";
type FilterKey = "tous" | "attente" | "sans-formation" | "badge";
type SortKey = "name" | "diagnostic" | "formation" | "activity";

const STATUS_LABEL = { declared: "Déclarée", proof: "Preuve déposée", badge: "Badge obtenu" } as const;

function fullName(employee: EntrepriseEmployee) {
  return [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "Collaborateur";
}

function initials(employee: EntrepriseEmployee) {
  const a = (employee.first_name ?? "").trim().slice(0, 1);
  const b = (employee.last_name ?? "").trim().slice(0, 1);
  return (a + b).toUpperCase() || "—";
}

function formatDay(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function relativeDay(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 30) return `Il y a ${days} jours`;
  return date.toLocaleDateString("fr-FR");
}

function bucketOf(employee: EntrepriseEmployee): "attente" | "sans" | "formation" {
  if (!employee.diagnostic_done) return "attente";
  if (!employee.formation_active && !employee.formation_title) return "sans";
  return "formation";
}

export function TeamDirectoryPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { loading, data, fetchError, organisationId, configurationRequired, reload } = useEntrepriseOverview();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [narrow, setNarrow] = useState(false);
  const [openAddSignal, setOpenAddSignal] = useState(0);
  const [reminded, setReminded] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });
  const [page, setPage] = useState(0);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState<string[] | null>(null);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [courseId, setCourseId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [localFormation, setLocalFormation] = useState<Record<string, string>>({});
  const [recruitment, setRecruitment] = useState<{ available: boolean; open: number; candidates: number } | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  const view: ViewMode = narrow
    ? "liste"
    : searchParams.get("vue") === "tableau"
      ? "tableau"
      : "liste";
  const filter = (searchParams.get("filtre") as FilterKey) || "tous";
  const department = searchParams.get("departement") ?? "";
  const openId = searchParams.get("collaborateur");

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const apply = () => setNarrow(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (searchParams.get("vue")) return;
    try {
      const stored = localStorage.getItem(VIEW_KEY);
      if (stored === "tableau") setParams({ vue: "tableau" });
    } catch {
      /* stockage indisponible */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (query.trim() === current) return;
      setParams({ q: query.trim() || null });
    }, 200);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const employees = useMemo(() => {
    const all = (data?.employees ?? []).map((employee) =>
      localFormation[employee.id]
        ? { ...employee, formation_active: true, formation_title: localFormation[employee.id] }
        : employee,
    );
    if (data?.demo_enriched) return all;
    return filterRealEntrepriseEmployees(all);
  }, [data, localFormation]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const employee of employees) if (employee.department) set.add(employee.department);
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [employees]);

  const searched = useMemo(() => {
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    return employees.filter((employee) => {
      if (department && employee.department !== department) return false;
      if (!q) return true;
      const hay = [fullName(employee), employee.email, employee.job_title, employee.department]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [employees, searchParams, department]);

  const counts = useMemo(
    () => ({
      tous: searched.length,
      attente: searched.filter((employee) => bucketOf(employee) === "attente").length,
      "sans-formation": searched.filter((employee) => bucketOf(employee) === "sans").length,
      badge: searched.filter((employee) => (employee.badge_count ?? 0) > 0).length,
    }),
    [searched],
  );

  const visible = useMemo(() => {
    return searched.filter((employee) => {
      if (filter === "attente") return bucketOf(employee) === "attente";
      if (filter === "sans-formation") return bucketOf(employee) === "sans";
      if (filter === "badge") return (employee.badge_count ?? 0) > 0;
      return true;
    });
  }, [searched, filter]);

  const sections = useMemo(() => {
    const order = [
      { key: "attente" as const, title: "À relancer" },
      { key: "sans" as const, title: "Sans formation" },
      { key: "formation" as const, title: "En formation" },
    ];
    return order
      .map((section) => ({
        ...section,
        rows: visible.filter((employee) => bucketOf(employee) === section.key),
      }))
      .filter((section) => section.rows.length > 0);
  }, [visible]);

  const sorted = useMemo(() => {
    const rows = [...visible];
    const dir = sort.dir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (sort.key === "name") return fullName(a).localeCompare(fullName(b), "fr") * dir;
      if (sort.key === "diagnostic") return (Number(a.diagnostic_done) - Number(b.diagnostic_done)) * dir;
      if (sort.key === "formation") return ((a.formation_percent ?? -1) - (b.formation_percent ?? -1)) * dir;
      return (a.last_activity_at ?? "").localeCompare(b.last_activity_at ?? "") * dir;
    });
    return rows;
  }, [visible, sort]);

  const pageRows = sorted.slice(page * 50, page * 50 + 50);
  const pageCount = Math.ceil(sorted.length / 50);
  const opened = employees.find((employee) => employee.id === openId) ?? null;
  const pending = employees.filter((employee) => !employee.diagnostic_done);
  const completed = data?.kpis?.diagnostics_completed ?? employees.filter((employee) => employee.diagnostic_done).length;
  const total = data?.kpis?.employees_total ?? employees.length;
  const inTraining = employees.filter((employee) => employee.formation_active || employee.formation_title).length;
  const progressValues = employees
    .map((employee) => employee.formation_percent)
    .filter((value): value is number => typeof value === "number");
  const progressAvg =
    typeof data?.kpis?.formation_progress_avg === "number"
      ? data.kpis.formation_progress_avg
      : progressValues.length
        ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
        : null;
  const badgeTotal =
    typeof data?.kpis?.badges_awarded === "number"
      ? data.kpis.badges_awarded
      : employees.some((employee) => typeof employee.badge_count === "number")
        ? employees.reduce((sum, employee) => sum + (employee.badge_count ?? 0), 0)
        : null;
  const badgesThisMonth = data?.kpis?.badges_this_month;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (data?.demo_enriched) {
        if (!cancelled) {
          setRecruitment({
            available: true,
            open: JADE_ENTREPRISE_OFFERS.filter((offer) => offer.status !== "closed").length,
            candidates: JADE_ENTREPRISE_OFFERS.reduce((sum, offer) => sum + offer.applications_count, 0),
          });
        }
        return;
      }
      try {
        const res = await fetch("/api/dashboard/entreprise/job-offers", { credentials: "include" });
        if (res.status === 404) {
          if (!cancelled) setRecruitment({ available: false, open: 0, candidates: 0 });
          return;
        }
        const json = (await res.json()) as { offers?: Array<{ status?: string | null; applications_count?: number }> };
        const list = json.offers ?? [];
        if (!cancelled) {
          setRecruitment({
            available: res.ok,
            open: list.filter((offer) => offer.status !== "closed").length,
            candidates: list.reduce((sum, offer) => sum + (offer.applications_count ?? 0), 0),
          });
        }
      } catch {
        if (!cancelled) setRecruitment({ available: false, open: 0, candidates: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data?.demo_enriched]);

  useEffect(() => {
    if (!opened) return;
    const root = panelRef.current;
    if (!root) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusable = () =>
      Array.from(root.querySelectorAll<HTMLElement>("button, a, input, [tabindex]:not([tabindex='-1'])"));
    focusable()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setParams({ collaborateur: null });
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened?.id]);

  const remind = async (ids: string[]) => {
    if (!ids.length) return;
    if (!window.confirm(`Relancer le diagnostic pour ${ids.length} collaborateur${ids.length > 1 ? "s" : ""} ?`)) return;
    setReminding(true);
    try {
      const res = await fetch("/api/dashboard/entreprise/diagnostics/remind", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_ids: ids }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; sent?: number };
      if (!res.ok) throw new Error(json.error || "Relance impossible");
      setReminded(true);
      toast.success(json.sent ? `${json.sent} relance${json.sent > 1 ? "s" : ""} envoyée${json.sent > 1 ? "s" : ""}` : "Relance envoyée");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Relance impossible");
    } finally {
      setReminding(false);
    }
  };

  const openAssign = async (ids: string[]) => {
    setAssignFor(ids);
    setCourseId("");
    if (data?.demo_enriched) {
      setCourses(JADE_ORG_COURSES.filter((course) => course.status === "published").map((course) => ({ id: course.id, title: course.title })));
      return;
    }
    const { data: rows } = await supabase.from("courses").select("id, title").eq("status", "published").limit(24);
    setCourses((rows ?? []).map((row) => ({ id: String(row.id), title: String(row.title ?? "Formation") })));
  };

  const confirmAssign = async () => {
    if (!assignFor?.length || !courseId) return;
    const title = courses.find((course) => course.id === courseId)?.title ?? "Formation";
    if (data?.demo_enriched || !organisationId) {
      setLocalFormation((current) => {
        const next = { ...current };
        for (const id of assignFor) next[id] = title;
        return next;
      });
      toast.success("Formation assignée");
      setAssignFor(null);
      return;
    }
    setAssigning(true);
    try {
      const targets = employees.filter((employee) => assignFor.includes(employee.id));
      for (const employee of targets) {
        if (!employee.email) continue;
        const res = await fetch("/api/courses/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            learnerEmail: employee.email,
            orgId: organisationId,
            allowCatalogueAssign: true,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new Error(json.error || "Assignation impossible");
      }
      setLocalFormation((current) => {
        const next = { ...current };
        for (const id of assignFor) next[id] = title;
        return next;
      });
      toast.success("Formation assignée");
      setAssignFor(null);
      void reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Assignation impossible");
    } finally {
      setAssigning(false);
    }
  };

  const removeFromTeam = async (employee: EntrepriseEmployee) => {
    if (!window.confirm(`Retirer ${fullName(employee)} de l'équipe ?`)) return;
    if (data?.demo_enriched) {
      toast.message("Action non disponible sur un profil démo");
      return;
    }
    const res = await fetch(`/api/dashboard/entreprise/employees/${encodeURIComponent(employee.id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast.error(json.error || "Suppression impossible");
      return;
    }
    toast.success("Collaborateur retiré");
    setMenuFor(null);
    void reload();
  };

  const toggleSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );
  };

  const gaugeCount = Math.min(total, 20);
  const filled = total > 0 ? Math.round((completed / total) * gaugeCount) : 0;

  return (
    <div className={cn("min-h-screen bg-[#F4F4F1] text-[#07080B]", manrope.className)}>
      <EnterpriseSidebar />
      <main className="min-h-screen px-4 py-8 pb-[120px] sm:px-6 lg:px-8 lg:pl-[264px]">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[40px] font-extrabold leading-none tracking-[-1.2px]">Mes équipes</h1>
            <p className="mt-2 text-[15px] text-[#3A3D45]">
              Suivez les diagnostics, formations et compétences de vos collaborateurs.
            </p>
          </div>
          <EnterpriseEmployeeCsvActions
            neo
            organisationId={organisationId}
            employees={employees}
            organisationName={data?.organisation?.name}
            departments={departments}
            autoOpenAdd={searchParams.get("invite") === "1"}
            openAddSignal={openAddSignal}
            onSuccess={() => void reload()}
          />
        </header>

        {configurationRequired && !organisationId ? (
          <p className="mt-6 rounded-[24px] bg-white p-4 text-sm text-[#8A4B0F]">
            Votre organisation n&apos;est pas encore liée.{" "}
            <Link href="/onboarding" className="font-semibold underline">Compléter la configuration</Link>
          </p>
        ) : null}

        {fetchError ? (
          <div className="mt-6 rounded-[26px] bg-white p-6">
            <p>{fetchError}</p>
            <button type="button" onClick={() => void reload()} className="mt-4 h-11 rounded-full bg-[#07080B] px-5 text-sm font-semibold text-white">
              Réessayer
            </button>
          </div>
        ) : null}

        <section className="relative mt-6 overflow-hidden rounded-[32px] bg-[#070C1C] px-6 py-8 text-center text-white">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(110,91,255,.4),transparent_70%)]" />
          <div className="relative">
            <p className="text-[14px] text-[#B5BAC6]">Compétences de l&apos;équipe · {total} collaborateurs</p>
            <p className="mt-3 font-extrabold leading-none tracking-[-3px] text-[clamp(56px,7vw,84px)]">
              {loading ? "—" : completed}
              <span className="text-[0.45em] font-extrabold text-[#B5BAC6]"> / {loading ? "—" : total}</span>
            </p>
            <p className="mt-2 text-[15px] text-[#DADDE4]">diagnostics complétés</p>
            {total > 20 ? (
              <div className="mx-auto mt-5 h-[5px] max-w-md overflow-hidden rounded-full bg-white/20">
                <div className="h-full bg-white" style={{ width: `${total ? (completed / total) * 100 : 0}%` }} />
              </div>
            ) : (
              <div className="mx-auto mt-5 flex max-w-md gap-1">
                {Array.from({ length: Math.max(gaugeCount, 1) }).map((_, index) => (
                  <span key={index} className={cn("h-[5px] flex-1 rounded-full", index < filled ? "bg-white" : "bg-white/20")} />
                ))}
              </div>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-6">
              <RoundAction label="Ajouter" primary onClick={() => setOpenAddSignal((value) => value + 1)} icon={<Plus className="h-5 w-5" />} />
              <RoundAction
                label={reminded ? "Relancé" : `Relancer (${pending.length})`}
                disabled={pending.length === 0 || reminding || reminded}
                onClick={() => void remind(pending.map((employee) => employee.id))}
                icon={<UserPlus className="h-5 w-5" />}
              />
              <RoundAction label="Assigner une formation" onClick={() => void openAssign(employees.map((employee) => employee.id))} icon={<GraduationCap className="h-5 w-5" />} />
              <RoundAction label="Recruter" onClick={() => router.push("/dashboard/entreprise/offres")} icon={<Briefcase className="h-5 w-5" />} />
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
          <article className="rounded-[26px] bg-white p-[22px]">
            <p className="text-[15px] font-semibold text-[#3A3D45]">Formations en cours</p>
            <p className="mt-2 text-[40px] font-extrabold leading-none">{loading ? "—" : inTraining}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#EEECE6]">
              <div className="h-full bg-[#6E5BFF]" style={{ width: `${progressAvg ?? 0}%` }} />
            </div>
            <p className="mt-2 text-[13px] text-[#6B6F7A]">
              {progressAvg == null ? "Avancement moyen indisponible" : `Avancement moyen ${progressAvg} %`}
            </p>
          </article>
          <article className="relative overflow-hidden rounded-[26px] bg-[#6E5BFF] p-[22px] text-white">
            <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/12" />
            <p className="text-[15px] font-semibold">Open Badges obtenus</p>
            <p className="mt-2 text-[40px] font-extrabold leading-none">{badgeTotal ?? "—"}</p>
            <p className="mt-2 text-[14px] text-white/85">
              {typeof badgesThisMonth === "number" ? `dont ${badgesThisMonth} ce mois-ci` : "ce mois-ci indisponible"}
            </p>
          </article>
          {recruitment?.available ? (
            <article className="rounded-[26px] bg-white p-[22px]">
              <p className="text-[15px] font-semibold text-[#3A3D45]">Recrutement</p>
              <p className="mt-2 text-[40px] font-extrabold leading-none">{recruitment.open}</p>
              <p className="mt-2 text-[14px] text-[#6B6F7A]">
                postes ouverts · {recruitment.candidates} candidats
              </p>
            </article>
          ) : null}
        </section>

        <div className="mt-6 flex flex-col gap-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6F7A]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom, email, poste, département"
              className="h-11 w-full rounded-full border border-[#E3E0D8] bg-white pl-11 pr-4 text-[14px] outline-none focus:border-[#6E5BFF]"
              aria-label="Rechercher un collaborateur"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <div role="tablist" aria-label="Affichage" className="inline-flex rounded-full bg-white p-1">
              {(["liste", "tableau"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={view === mode}
                  disabled={narrow && mode === "tableau"}
                  onClick={() => {
                    try { localStorage.setItem(VIEW_KEY, mode); } catch { /* ignore */ }
                    setParams({ vue: mode });
                  }}
                  className={cn(
                    "h-10 rounded-full px-4 text-[14px] font-semibold",
                    view === mode ? "bg-[#07080B] text-white" : "text-[#3A3D45]",
                  )}
                >
                  {mode === "liste" ? "Liste" : "Tableau"}
                </button>
              ))}
            </div>
            {(
              [
                ["tous", "Tous"],
                ["attente", "Diagnostic en attente"],
                ["sans-formation", "Sans formation"],
                ["badge", "Avec badge"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setPage(0); setParams({ filtre: key === "tous" ? null : key }); }}
                className={cn(
                  "inline-flex h-10 items-center gap-2 rounded-full px-3 text-[13px] font-semibold",
                  filter === key ? "bg-[#07080B] text-white" : "bg-white text-[#07080B]",
                )}
              >
                {label}
                <span className={cn("rounded-full px-1.5 text-[11px]", filter === key ? "bg-white/15" : "bg-[#F4F4F1]")}>
                  {counts[key]}
                </span>
              </button>
            ))}
            {departments.length > 3 ? (
              <select
                value={department}
                onChange={(event) => setParams({ departement: event.target.value || null })}
                className="h-10 rounded-full border border-[#E3E0D8] bg-white px-3 text-[13px]"
                aria-label="Département"
              >
                <option value="">Tous les départements</option>
                {departments.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[68px] animate-pulse rounded-[18px] bg-white" />
            ))}
          </div>
        ) : employees.length === 0 ? (
          <div className="mt-6 rounded-[26px] bg-white px-6 py-14 text-center">
            <h2 className="text-[20px] font-extrabold">Ajoutez vos premiers collaborateurs</h2>
            <div className="mt-5 flex justify-center gap-2">
              <button type="button" onClick={() => setOpenAddSignal((value) => value + 1)} className="h-11 rounded-full bg-[#07080B] px-5 text-sm font-semibold text-white">
                Ajouter
              </button>
              <button type="button" onClick={() => document.getElementById("entreprise-csv-import")?.click()} className="h-11 rounded-full border border-[#E3E0D8] bg-white px-5 text-sm font-semibold">
                Importer CSV
              </button>
            </div>
          </div>
        ) : view === "liste" ? (
          <div className="mt-6 space-y-4">
            {sections.map((section) => (
              <section key={section.key} className="rounded-[26px] bg-white p-3">
                <div className="flex items-center justify-between px-2 py-2">
                  <h2 className="text-[15px] font-extrabold">{section.title}</h2>
                  <span className="text-[13px] text-[#6B6F7A]">{section.rows.length}</span>
                </div>
                <ul>
                  {section.rows.map((employee) => (
                    <li key={employee.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setParams({ collaborateur: employee.id })}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setParams({ collaborateur: employee.id });
                          }
                        }}
                        className="flex min-h-[68px] items-center gap-3 rounded-[18px] px-3.5 py-2.5 hover:bg-[#F7F5FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6E5BFF]"
                      >
                        <Avatar employee={employee} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-extrabold">{fullName(employee)}</p>
                          <p className="truncate text-[13px] text-[#6B6F7A]">{lineDetail(employee)}</p>
                        </div>
                        {bucketOf(employee) === "attente" ? (
                          <button type="button" onClick={(event) => { event.stopPropagation(); void remind([employee.id]); }} className="h-10 shrink-0 rounded-full bg-[#07080B] px-3 text-[13px] font-semibold text-white">
                            Relancer
                          </button>
                        ) : null}
                        {bucketOf(employee) === "sans" ? (
                          <button type="button" onClick={(event) => { event.stopPropagation(); void openAssign([employee.id]); }} className="h-10 shrink-0 rounded-full border border-[#E3E0D8] px-3 text-[13px] font-semibold">
                            Assigner
                          </button>
                        ) : null}
                        <div className="w-16 text-right">
                          <p className="text-[18px] font-extrabold">{strongValue(employee).value}</p>
                          <p className="text-[12px] text-[#6B6F7A]">{strongValue(employee).label}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#6B6F7A]" />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            {selected.length > 0 ? (
              <div className="mb-3 flex flex-wrap items-center gap-3 rounded-full bg-[#07080B] px-4 py-2 text-white">
                <span className="text-[14px] font-semibold">{selected.length} collaborateurs sélectionnés</span>
                <button type="button" onClick={() => void remind(selected)} className="h-10 rounded-full bg-white px-3 text-[13px] font-semibold text-[#07080B]">
                  Relancer le diagnostic
                </button>
                <button type="button" onClick={() => void openAssign(selected)} className="h-10 rounded-full border border-white/30 px-3 text-[13px] font-semibold">
                  Assigner une formation
                </button>
                <button type="button" onClick={() => setSelected([])} className="ml-auto" aria-label="Fermer la sélection">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            <div className="overflow-x-auto rounded-[24px] bg-white">
              <table className="w-full min-w-[1040px] text-left">
                <thead>
                  <tr className="text-[13px] font-bold text-[#6B6F7A]">
                    <th className="px-3 py-3">
                      <input
                        type="checkbox"
                        aria-label="Tout sélectionner"
                        checked={pageRows.length > 0 && pageRows.every((row) => selected.includes(row.id))}
                        onChange={(event) => {
                          setSelected(event.target.checked ? pageRows.map((row) => row.id) : []);
                        }}
                      />
                    </th>
                    <SortableTh label="Collaborateur" active={sort.key === "name"} dir={sort.dir} onClick={() => toggleSort("name")} />
                    <SortableTh label="Diagnostic" active={sort.key === "diagnostic"} dir={sort.dir} onClick={() => toggleSort("diagnostic")} />
                    <SortableTh label="Formation" active={sort.key === "formation"} dir={sort.dir} onClick={() => toggleSort("formation")} />
                    <th className="px-3 py-3">Compétences</th>
                    <th className="px-3 py-3">Badges</th>
                    <SortableTh label="Activité" active={sort.key === "activity"} dir={sort.dir} onClick={() => toggleSort("activity")} />
                    <th className="px-3 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((employee) => (
                    <tr key={employee.id} className="border-t border-[#EEECE6]">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Sélectionner ${fullName(employee)}`}
                          checked={selected.includes(employee.id)}
                          onChange={(event) => {
                            setSelected((current) =>
                              event.target.checked ? [...current, employee.id] : current.filter((id) => id !== employee.id),
                            );
                          }}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <button type="button" onClick={() => setParams({ collaborateur: employee.id })} className="flex items-center gap-3 text-left">
                          <Avatar employee={employee} />
                          <span>
                            <span className="block text-[15px] font-extrabold">{fullName(employee)}</span>
                            <span className="block text-[13px] text-[#6B6F7A]">{employee.job_title ?? "—"} · {employee.department ?? "—"}</span>
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill done={employee.diagnostic_done} />
                        <p className="mt-1 text-[12px] text-[#6B6F7A]">
                          {employee.diagnostic_done
                            ? `${employee.diagnostic_label ?? "Diagnostic"} · ${formatDay(employee.diagnostic_at) ?? "date inconnue"}`
                            : null}
                        </p>
                        {!employee.diagnostic_done ? (
                          <button type="button" onClick={() => void remind([employee.id])} className="mt-1 h-9 rounded-full bg-[#07080B] px-3 text-[12px] font-semibold text-white">
                            Relancer
                          </button>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        {employee.formation_title || employee.formation_active ? (
                          <>
                            <p className="text-[14px] font-semibold">{employee.formation_title ?? "Formation en cours"}</p>
                            {typeof employee.formation_percent === "number" ? (
                              <>
                                <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-[#EEECE6]">
                                  <div className="h-full bg-[#6E5BFF]" style={{ width: `${employee.formation_percent}%` }} />
                                </div>
                                <p className="text-[12px] text-[#6B6F7A]">{employee.formation_percent} %</p>
                              </>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <p className="text-[14px]">Aucune formation</p>
                            <button type="button" onClick={() => void openAssign([employee.id])} className="mt-1 h-9 rounded-full border border-[#E3E0D8] px-3 text-[12px] font-semibold">
                              Assigner
                            </button>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(employee.skills ?? []).slice(0, 2).map((skill) => (
                            <span key={skill.name} className="rounded-full bg-[#F4F4F1] px-2 py-1 text-[12px]">{skill.name}</span>
                          ))}
                          {(employee.skills?.length ?? 0) > 2 ? (
                            <span className="rounded-full bg-[#F4F4F1] px-2 py-1 text-[12px]">+{(employee.skills?.length ?? 0) - 2}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 text-[14px] font-semibold">
                          <Award className="h-4 w-4" /> {employee.badge_count ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-[13px] text-[#6B6F7A]">{relativeDay(employee.last_activity_at)}</td>
                      <td className="relative px-3 py-3">
                        <button type="button" aria-label="Actions" onClick={() => setMenuFor(menuFor === employee.id ? null : employee.id)} className="rounded-full p-2 hover:bg-[#F4F4F1]">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {menuFor === employee.id ? (
                          <div className="absolute right-3 z-10 w-48 rounded-2xl border border-[#E3E0D8] bg-white p-1 shadow-lg">
                            <button type="button" className="block w-full rounded-xl px-3 py-2 text-left text-[13px] hover:bg-[#F7F5FF]" onClick={() => { setMenuFor(null); setParams({ collaborateur: employee.id }); }}>Voir le profil</button>
                            <button type="button" className="block w-full rounded-xl px-3 py-2 text-left text-[13px] hover:bg-[#F7F5FF]" onClick={() => { setMenuFor(null); void remind([employee.id]); }}>Relancer</button>
                            <button type="button" className="block w-full rounded-xl px-3 py-2 text-left text-[13px] hover:bg-[#F7F5FF]" onClick={() => { setMenuFor(null); void openAssign([employee.id]); }}>Assigner</button>
                            <button type="button" className="block w-full rounded-xl px-3 py-2 text-left text-[13px] hover:bg-[#F7F5FF]" onClick={() => void removeFromTeam(employee)}>Retirer de l&apos;équipe</button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pageCount > 1 ? (
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)} className="h-10 rounded-full border border-[#E3E0D8] bg-white px-4 text-sm disabled:opacity-40">Précédent</button>
                <button type="button" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)} className="h-10 rounded-full border border-[#E3E0D8] bg-white px-4 text-sm disabled:opacity-40">Suivant</button>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {opened ? (
        <div className="fixed inset-0 z-[80] flex justify-end bg-[rgba(7,12,28,.35)]">
          <button type="button" className="absolute inset-0" aria-label="Fermer le profil" onClick={() => setParams({ collaborateur: null })} />
          <aside ref={panelRef} role="dialog" aria-modal="true" aria-label={fullName(opened)} className="relative flex h-full w-full max-w-[440px] flex-col overflow-y-auto bg-white p-6">
            <button type="button" onClick={() => setParams({ collaborateur: null })} className="absolute right-4 top-4 rounded-full p-2" aria-label="Fermer">
              <X className="h-5 w-5" />
            </button>
            <Avatar employee={opened} size={56} />
            <h2 className="mt-4 text-[22px] font-extrabold">{fullName(opened)}</h2>
            <p className="text-[14px] text-[#6B6F7A]">{opened.job_title ?? "Poste non renseigné"} · {opened.department ?? "Département non renseigné"}</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <Mini label="Formation" value={typeof opened.formation_percent === "number" ? `${opened.formation_percent} %` : opened.formation_active ? "En cours" : "—"} />
              <Mini label="Compétences" value={String(opened.skills?.length ?? "—")} />
              <Mini label="Badges" value={String(opened.badge_count ?? "—")} violet />
            </div>
            <div className="mt-5 rounded-[18px] border border-[#EEECE6] p-4">
              <div className="flex items-center justify-between">
                <p className="font-extrabold">Diagnostic</p>
                <StatusPill done={opened.diagnostic_done} />
              </div>
              <p className="mt-2 text-[13px] text-[#6B6F7A]">
                {opened.diagnostic_done
                  ? `${opened.diagnostic_label ?? "Diagnostic"} · ${formatDay(opened.diagnostic_at) ?? "date inconnue"}`
                  : "Diagnostic en attente"}
              </p>
              {opened.diagnostic_done ? (
                <Link href={`/dashboard/entreprise/salaries/${opened.id}`} className="mt-3 inline-flex text-[14px] font-semibold text-[#4B3BD1]">
                  Voir le rapport
                </Link>
              ) : (
                <button type="button" onClick={() => void remind([opened.id])} className="mt-3 h-10 rounded-full bg-[#07080B] px-4 text-[13px] font-semibold text-white">
                  Relancer
                </button>
              )}
            </div>
            <div className="mt-5">
              <p className="font-extrabold">Compétences déclarées</p>
              <ul className="mt-2 space-y-2">
                {(opened.skills ?? []).length === 0 ? <li className="text-[13px] text-[#6B6F7A]">Aucune compétence déclarée</li> : null}
                {(opened.skills ?? []).map((skill) => (
                  <li key={skill.name} className="flex items-center justify-between text-[14px]">
                    <span>{skill.name}</span>
                    <span className="rounded-full bg-[#F4F4F1] px-2 py-1 text-[12px]">{STATUS_LABEL[skill.status]}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex gap-2">
              <Link href={`/dashboard/entreprise/salaries/${opened.id}`} className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-[#07080B] text-[14px] font-semibold text-white">
                Voir le profil complet
              </Link>
              <button type="button" onClick={() => void openAssign([opened.id])} className="h-11 rounded-full border border-[#E3E0D8] px-4 text-[14px] font-semibold">
                Assigner
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {assignFor ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(7,12,28,.35)] p-4">
          <div className="w-full max-w-md rounded-[26px] bg-white p-6">
            <h3 className="text-[18px] font-extrabold">Assigner une formation</h3>
            <p className="mt-1 text-[13px] text-[#6B6F7A]">{assignFor.length} collaborateur{assignFor.length > 1 ? "s" : ""}</p>
            {courses.length === 0 ? (
              <p className="mt-4 text-[14px]">
                Aucune formation chargée.{" "}
                <Link href="/dashboard/entreprise/formations/catalogue" className="font-semibold text-[#4B3BD1]">Ouvrir Byound Online</Link>
              </p>
            ) : (
              <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="mt-4 h-11 w-full rounded-2xl border border-[#E3E0D8] px-3" aria-label="Formation">
                <option value="">Choisir une formation</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setAssignFor(null)} className="h-11 rounded-full border border-[#E3E0D8] px-4 text-sm font-semibold">Annuler</button>
              <button type="button" disabled={!courseId || assigning} onClick={() => void confirmAssign()} className="h-11 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white disabled:opacity-40">
                Assigner
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function lineDetail(employee: EntrepriseEmployee) {
  const job = employee.job_title ?? "Poste non renseigné";
  if (!employee.diagnostic_done) {
    const since = formatDay(employee.created_at);
    return `${job} · Diagnostic en attente${since ? ` depuis le ${since}` : ""}`;
  }
  if (employee.formation_title) return `${job} · ${employee.formation_title}`;
  if (employee.formation_active) return `${job} · Formation en cours`;
  return `${job} · Aucune formation`;
}

function strongValue(employee: EntrepriseEmployee) {
  if (typeof employee.formation_percent === "number") return { value: `${employee.formation_percent} %`, label: "formation" };
  if ((employee.badge_count ?? 0) > 0) return { value: String(employee.badge_count), label: "badges" };
  return { value: "—", label: "à planifier" };
}

function Avatar({ employee, size = 44 }: { employee: EntrepriseEmployee; size?: number }) {
  if (employee.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={employee.avatar_url} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#6E5BFF] font-bold text-white" style={{ width: size, height: size, fontSize: size > 48 ? 18 : 14 }}>
      {initials(employee)}
    </span>
  );
}

function RoundAction({ label, onClick, icon, primary, disabled }: { label: string; onClick: () => void; icon: ReactNode; primary?: boolean; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="flex w-[92px] flex-col items-center gap-2 disabled:opacity-40">
      <span className={cn("flex h-14 w-14 items-center justify-center rounded-full text-white", primary ? "bg-[#6E5BFF]" : "bg-white/12")}>{icon}</span>
      <span className="text-[13px] leading-tight">{label}</span>
    </button>
  );
}

function StatusPill({ done }: { done: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12px] font-semibold", done ? "bg-[#E3F6EC] text-[#126B3B]" : "bg-[#FFF1E2] text-[#8A4B0F]")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", done ? "bg-[#1F9D57]" : "bg-[#E7782C]")} />
      {done ? "Complété" : "En attente"}
    </span>
  );
}

function Mini({ label, value, violet }: { label: string; value: string; violet?: boolean }) {
  return (
    <div className={cn("rounded-2xl p-3", violet ? "bg-[#6E5BFF] text-white" : "bg-[#F4F4F1]")}>
      <p className="text-[18px] font-extrabold">{value}</p>
      <p className={cn("text-[12px]", violet ? "text-white/80" : "text-[#6B6F7A]")}>{label}</p>
    </div>
  );
}

function SortableTh({ label, active, dir, onClick }: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void }) {
  return (
    <th className="px-3 py-3" aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={onClick} className="font-bold text-[#6B6F7A]">{label}</button>
    </th>
  );
}
