"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CFA_SPECIALIZATIONS, getCfaSpecializationLabel } from "@/lib/cfa-applications";
import { formatCompanyName, formatPersonName } from "@/lib/cfa/format-org-name";
import {
  CFA_HOST_MAIL_REMINDER_DAYS,
  CFA_HOST_OFFER_REMINDER_DAYS,
  CFA_HOST_STAGES,
  daysSince,
  dbStatusForHostStage,
  hostStageFromStatus,
  hostStageMeta,
  relativeDaysAgo,
  shortFrWeekdayDate,
  trackColor,
  type CfaHostStageId,
} from "@/lib/cfa/host-company-stages";
import type { CfaCompanyStatus } from "@/lib/cfa-companies";
import { looksLikeTestAccount } from "@/lib/control/test-account";
import {
  PageTitle,
  StageStrip,
  TestToggle,
  ViewSwitch,
} from "@/components/control/cfa-board-chrome";

type CfaCompany = {
  id: string;
  company_name: string;
  siret: string | null;
  contact_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_role: string | null;
  email: string | null;
  phone: string | null;
  company_address: string | null;
  city: string | null;
  naf_label: string | null;
  soft_skills: string | null;
  apprentices_wanted: number | null;
  apprentice_track_1: string | null;
  status: CfaCompanyStatus;
  created_at: string;
  updated_at?: string | null;
  next_action?: string | null;
  next_action_at?: string | null;
  last_status_at?: string | null;
  last_action_at?: string | null;
  candidates_proposed?: number;
  apprentices_recruited?: number;
  offer_with_client?: boolean;
};

const fieldClass =
  "h-10 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm text-[#F2F4FA] outline-none";

const AVATAR_GRADIENTS = [
  ["#6E5BFF", "#2A1E8F"],
  ["#14836E", "#0B3B36"],
  ["#2F6FD6", "#0E2A5C"],
  ["#B65BFF", "#3B1466"],
  ["#C9A227", "#5A4510"],
] as const;

function hashId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function avatarGradient(id: string) {
  const [a, b] = AVATAR_GRADIENTS[hashId(id) % AVATAR_GRADIENTS.length]!;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function isTestCompany(company: CfaCompany) {
  return looksLikeTestAccount({
    email: company.email,
    name: company.company_name,
  });
}

function contactLabel(company: CfaCompany) {
  const name =
    formatPersonName(
      [company.contact_first_name, company.contact_last_name].filter(Boolean).join(" ") ||
        company.contact_name,
    ) || "";
  if (!name) return null;
  const role = company.contact_role?.trim();
  return role ? `${name} · ${formatPersonName(role)}` : name;
}

function citySector(company: CfaCompany) {
  const city = formatCompanyName(company.city) || null;
  const sector = company.naf_label?.trim() || null;
  if (city && sector) return `${city} · ${sector}`;
  return city || sector || null;
}

function readUrlState() {
  if (typeof window === "undefined") {
    return { q: "", track: "all", remind: false, showTest: false, view: "board" as const };
  }
  const url = new URL(window.location.href);
  return {
    q: url.searchParams.get("q") || "",
    track: url.searchParams.get("track") || "all",
    remind: url.searchParams.get("remind") === "1",
    showTest: url.searchParams.get("test") === "1",
    view: url.searchParams.get("view") === "list" ? ("list" as const) : ("board" as const),
  };
}

function writeUrlState(state: {
  q: string;
  track: string;
  remind: boolean;
  showTest: boolean;
  view: "board" | "list";
}) {
  const url = new URL(window.location.href);
  if (!state.q.trim()) url.searchParams.delete("q");
  else url.searchParams.set("q", state.q);
  if (state.track === "all") url.searchParams.delete("track");
  else url.searchParams.set("track", state.track);
  if (!state.remind) url.searchParams.delete("remind");
  else url.searchParams.set("remind", "1");
  if (!state.showTest) url.searchParams.delete("test");
  else url.searchParams.set("test", "1");
  if (state.view === "board") url.searchParams.delete("view");
  else url.searchParams.set("view", state.view);
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

function needsMailRemind(company: CfaCompany) {
  if (hostStageFromStatus(company.status) !== "email_sent") return false;
  const ref = company.last_status_at || company.last_action_at || company.updated_at || company.created_at;
  const n = daysSince(ref);
  return n != null && n >= CFA_HOST_MAIL_REMINDER_DAYS;
}

function needsOfferRemind(company: CfaCompany) {
  if (hostStageFromStatus(company.status) !== "creating_offer") return false;
  if (!company.offer_with_client) return false;
  const ref = company.last_status_at || company.last_action_at || company.updated_at || company.created_at;
  const n = daysSince(ref);
  return n != null && n >= CFA_HOST_OFFER_REMINDER_DAYS;
}

function isOverdue(company: CfaCompany) {
  return needsMailRemind(company) || needsOfferRemind(company);
}

function footerMeta(company: CfaCompany): { text: string | null; overdue: boolean } {
  const stage = hostStageFromStatus(company.status);
  const overdue = isOverdue(company);
  if (stage === "to_contact") {
    const rel = relativeDaysAgo(company.created_at);
    return { text: rel ? `Ajoutée ${rel}` : null, overdue: false };
  }
  if (stage === "email_sent") {
    const ref = company.last_status_at || company.last_action_at || company.updated_at;
    const rel = relativeDaysAgo(ref);
    return { text: rel ? `Mail envoyé ${rel}` : null, overdue };
  }
  if (stage === "appointment") {
    const when = shortFrWeekdayDate(company.next_action_at);
    return { text: when ? `RDV ${when}` : company.next_action || null, overdue: false };
  }
  if (stage === "creating_offer") {
    return {
      text: company.offer_with_client ? "Offre chez le client" : "Offre en rédaction",
      overdue,
    };
  }
  if (stage === "recruiting") {
    const n = company.candidates_proposed ?? 0;
    return { text: `${n} candidat${n > 1 ? "s" : ""} proposé${n > 1 ? "s" : ""}`, overdue: false };
  }
  if (stage === "recruited") {
    const n = company.apprentices_recruited ?? 0;
    return { text: `${n} alternant${n > 1 ? "s" : ""} recruté${n > 1 ? "s" : ""}`, overdue: false };
  }
  return { text: null, overdue: false };
}

function primaryAction(company: CfaCompany): { label: string; tone: "blue" | "red" | "amber" | "teal" | "none" } | null {
  const stage = hostStageFromStatus(company.status);
  if (stage === "to_contact") return { label: "Contacter", tone: "blue" };
  if (stage === "email_sent") return { label: "Relancer", tone: needsMailRemind(company) ? "red" : "blue" };
  if (stage === "appointment") return { label: "Préparer", tone: "blue" };
  if (stage === "creating_offer") {
    return company.offer_with_client
      ? { label: "Relancer", tone: needsOfferRemind(company) ? "red" : "amber" }
      : { label: "Publier", tone: "amber" };
  }
  if (stage === "recruiting") return { label: "Voir les candidats", tone: "teal" };
  return null;
}

export function CfaCompanyPipelineClient({
  apiPath = "/api/super-admin/crm/cfa/companies",
  readOnly = false,
}: {
  apiPath?: string;
  readOnly?: boolean;
} = {}) {
  const router = useRouter();
  const initial = readUrlState();
  const [companies, setCompanies] = useState<CfaCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState(initial.q);
  const [track, setTrack] = useState(initial.track);
  const [remindOnly, setRemindOnly] = useState(initial.remind);
  const [showTest, setShowTest] = useState(initial.showTest);
  const [view, setView] = useState<"board" | "list">(initial.view);
  const [open, setOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<CfaCompanyStatus>("to_contact");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [siret, setSiret] = useState("");
  const [lookup, setLookup] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [track1, setTrack1] = useState("");
  const [saving, setSaving] = useState(false);
  const [lostCompany, setLostCompany] = useState<CfaCompany | null>(null);
  const [lostReason, setLostReason] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<CfaCompany | null>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const columnRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(apiPath, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Chargement impossible");
      setCompanies(result.companies ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  useEffect(() => {
    writeUrlState({ q: query, track, remind: remindOnly, showTest, view });
  }, [query, track, remindOnly, showTest, view]);

  const testCount = useMemo(() => companies.filter(isTestCompany).length, [companies]);

  const visible = useMemo(() => {
    return companies.filter((company) => {
      if (!showTest && isTestCompany(company)) return false;
      if (track !== "all" && company.apprentice_track_1 !== track) return false;
      if (remindOnly && !isOverdue(company)) return false;
      const hay = `${company.company_name} ${company.contact_name ?? ""} ${company.email ?? ""} ${company.city ?? ""}`.toLowerCase();
      return hay.includes(query.trim().toLowerCase());
    });
  }, [companies, showTest, track, remindOnly, query]);

  const remindCount = useMemo(
    () => companies.filter((c) => (showTest || !isTestCompany(c)) && isOverdue(c)).length,
    [companies, showTest],
  );

  const stageCounts = useMemo(() => {
    const map = Object.fromEntries(CFA_HOST_STAGES.map((s) => [s.id, 0])) as Record<CfaHostStageId, number>;
    for (const company of visible) {
      const stage = hostStageFromStatus(company.status);
      if (stage) map[stage] += 1;
    }
    return map;
  }, [visible]);

  const openPosts = useMemo(
    () =>
      visible
        .filter((c) => hostStageFromStatus(c.status) !== "recruited")
        .reduce((sum, c) => sum + (c.apprentices_wanted ?? 0), 0),
    [visible],
  );
  const recruitedCount = useMemo(
    () => visible.reduce((sum, c) => sum + (c.apprentices_recruited ?? 0), 0),
    [visible],
  );

  async function changeStatus(company: CfaCompany, status: CfaCompanyStatus, reason = "") {
    if (status === "not_recruited" && !reason) {
      setLostCompany(company);
      setLostReason("");
      return false;
    }
    const previous = company.status;
    setCompanies((current) =>
      current.map((item) => (item.id === company.id ? { ...item, status } : item)),
    );
    setError("");
    try {
      const response = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: company.id, status, reason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Mise à jour impossible");
      setCompanies((current) =>
        current.map((item) => (item.id === company.id ? { ...item, ...result.company } : item)),
      );
      return true;
    } catch (updateError) {
      setCompanies((current) =>
        current.map((item) => (item.id === company.id ? { ...item, status: previous } : item)),
      );
      setError(updateError instanceof Error ? updateError.message : "Mise à jour impossible");
      return false;
    }
  }

  function openCreate(status: CfaCompanyStatus = "to_contact") {
    setCreateStatus(status);
    setCompanyName("");
    setCompanyAddress("");
    setSiret("");
    setLookup("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setQuantity(1);
    setTrack1("");
    setOpen(true);
  }

  async function lookupSiret(value: string) {
    const digits = value.replace(/\s/g, "");
    setSiret(digits);
    setLookup("");
    if (!/^\d{14}$/.test(digits)) return;
    setLookup("Recherche du SIRET…");
    try {
      const response = await fetch(`${apiPath}/lookup?siret=${digits}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Entreprise introuvable");
      if (result.companyName) setCompanyName(formatCompanyName(result.companyName));
      if (result.address) setCompanyAddress(result.address);
      setLookup(result.companyName ? `Entreprise trouvée : ${formatCompanyName(result.companyName)}` : "SIRET reconnu");
    } catch (lookupError) {
      setLookup(lookupError instanceof Error ? lookupError.message : "Recherche impossible");
    }
  }

  async function createCompany(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formatCompanyName(companyName),
          siret,
          companyAddress,
          contactName: `${formatPersonName(firstName)} ${formatPersonName(lastName)}`.trim(),
          firstName: formatPersonName(firstName),
          lastName: formatPersonName(lastName),
          email,
          phone,
          apprenticesWanted: quantity,
          apprenticeTrack1: track1,
          status: createStatus,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Création impossible");
      setCompanies((current) => [result.company, ...current]);
      setOpen(false);
      if (result.company?.id) router.push(`/super/cfa/entreprises/${result.company.id}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Création impossible");
    } finally {
      setSaving(false);
    }
  }

  function openCompany(company: CfaCompany) {
    if (!readOnly) router.push(`/super/cfa/entreprises/${company.id}`);
  }

  function runAction(company: CfaCompany, e: React.MouseEvent) {
    e.stopPropagation();
    const stage = hostStageFromStatus(company.status);
    if (stage === "to_contact" || stage === "email_sent") {
      const params = new URLSearchParams();
      if (company.email) params.set("to", company.email);
      if (company.contact_name || company.contact_first_name) {
        params.set(
          "name",
          formatPersonName(
            [company.contact_first_name, company.contact_last_name].filter(Boolean).join(" ") ||
              company.contact_name ||
              "",
          ),
        );
      }
      params.set("company", formatCompanyName(company.company_name));
      router.push(`/super/crm/emails?${params.toString()}`);
      return;
    }
    openCompany(company);
  }

  function scrollToStage(stageId: string) {
    const el = columnRefs.current[stageId];
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function updateScrollHint() {
    const el = boardRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }

  useEffect(() => {
    updateScrollHint();
    const el = boardRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollHint);
    window.addEventListener("resize", updateScrollHint);
    return () => {
      el.removeEventListener("scroll", updateScrollHint);
      window.removeEventListener("resize", updateScrollHint);
    };
  }, [visible, view, loading]);

  function onDragStart(event: DragStartEvent) {
    const company = visible.find((c) => c.id === String(event.active.id));
    setActiveDrag(company ?? null);
    setMenuId(null);
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    const overId = event.over?.id ? String(event.over.id) : "";
    const companyId = String(event.active.id);
    const company = companies.find((c) => c.id === companyId);
    if (!company || !overId.startsWith("stage:")) return;
    const stageId = overId.replace("stage:", "") as CfaHostStageId;
    const nextStatus = dbStatusForHostStage(stageId);
    if (company.status === nextStatus) return;
    const ok = await changeStatus(company, nextStatus);
    if (!ok) setNotice("Déplacement annulé.");
  }

  const byStage = useMemo(() => {
    const map = Object.fromEntries(CFA_HOST_STAGES.map((s) => [s.id, [] as CfaCompany[]])) as Record<
      CfaHostStageId,
      CfaCompany[]
    >;
    for (const company of visible) {
      const stage = hostStageFromStatus(company.status);
      if (stage) map[stage].push(company);
    }
    return map;
  }, [visible]);

  return (
    <div className="space-y-5 px-3 py-6 text-[#F2F4FA] sm:px-6 sm:py-8">
      <PageTitle
        title="Entreprises d'accueil"
        subtitle={`${visible.length} entreprise${visible.length > 1 ? "s" : ""} · ${remindCount} relance${remindCount > 1 ? "s" : ""} à faire cette semaine`}
        actions={
          readOnly ? null : (
            <button
              type="button"
              onClick={() => openCreate("to_contact")}
              className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white"
            >
              ＋ Entreprise
            </button>
          )
        }
      />

      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}
      {notice ? <p className="text-sm text-[#F2CF6B]">{notice}</p> : null}

      <StageStrip
        title="Du premier contact au recrutement"
        meta={`${openPosts} poste${openPosts > 1 ? "s" : ""} ouvert${openPosts > 1 ? "s" : ""} au total · ${recruitedCount} alternant${recruitedCount > 1 ? "s" : ""} recruté${recruitedCount > 1 ? "s" : ""}`}
        items={CFA_HOST_STAGES.map((stage) => ({
          id: stage.id,
          label: stage.label,
          count: stageCounts[stage.id],
          color: stage.color,
        }))}
        onSelect={scrollToStage}
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="⌕ Rechercher une entreprise"
          className="w-[250px] rounded-full border border-[#26304F] bg-[#0B1122] px-4 py-2 text-sm outline-none placeholder:text-[#6C7593]"
        />
        <select
          value={track}
          onChange={(e) => setTrack(e.target.value)}
          className="rounded-full border border-[#26304F] bg-[#111831] px-3 py-2 text-sm text-[#B7BED3]"
        >
          <option value="all">Tous les cursus</option>
          {CFA_SPECIALIZATIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setRemindOnly((v) => !v)}
          className="rounded-full px-3.5 py-1.5 text-sm font-semibold"
          style={{
            background: remindOnly ? "#FFFFFF" : "#111831",
            color: remindOnly ? "#0A0F1E" : "#B7BED3",
            border: remindOnly ? "1px solid #FFFFFF" : "1px solid #1A2340",
          }}
        >
          À relancer {remindCount}
        </button>
        <select
          className="rounded-full border border-[#26304F] bg-[#111831] px-3 py-2 text-sm text-[#B7BED3]"
          defaultValue="all"
          aria-label="Chargé de compte"
        >
          <option value="all">Chargé : tous</option>
        </select>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <TestToggle checked={showTest} count={testCount} onChange={setShowTest} />
          <ViewSwitch value={view} onChange={setView} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-[22px] bg-[#111831]" />
          ))}
        </div>
      ) : view === "list" ? (
        <ListView
          companies={visible}
          onOpen={openCompany}
          onAction={runAction}
          menuId={menuId}
          setMenuId={setMenuId}
          onMove={(company, status) => void changeStatus(company, status)}
        />
      ) : (
        <div className="relative">
          <div
            ref={boardRef}
            className="flex gap-[14px] overflow-x-auto pb-4"
            style={{ scrollbarWidth: "thin" }}
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={onDragStart}
              onDragEnd={(e) => void onDragEnd(e)}
            >
              {CFA_HOST_STAGES.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stageId={stage.id}
                  companies={byStage[stage.id]}
                  columnRef={(el) => {
                    columnRefs.current[stage.id] = el;
                  }}
                  onAdd={() => openCreate(dbStatusForHostStage(stage.id))}
                  onOpen={openCompany}
                  onAction={runAction}
                  menuId={menuId}
                  setMenuId={setMenuId}
                  onMove={(company, status) => void changeStatus(company, status)}
                  readOnly={readOnly}
                />
              ))}
              <DragOverlay>
                {activeDrag ? <CompanyCard company={activeDrag} overlay /> : null}
              </DragOverlay>
            </DndContext>
          </div>
          {canScrollRight ? (
            <button
              type="button"
              aria-label="Défiler"
              onClick={() => boardRef.current?.scrollBy({ left: 276, behavior: "smooth" })}
              className="absolute top-1/2 right-0 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-[#0A0F1E] shadow-lg"
              style={{
                boxShadow: "-24px 0 32px #0A0F1E",
              }}
            >
              ›
            </button>
          ) : null}
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-[#0A0F1E]/85 p-4 backdrop-blur-sm sm:items-center">
          <form
            onSubmit={(event) => void createCompany(event)}
            className="my-8 w-full max-w-lg rounded-[24px] border border-[#1A2340] bg-[#111831] p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-[#F2F4FA]">Nouvelle entreprise</h2>
                <p className="mt-1 text-sm text-[#9AA3BD]">
                  Étape : {hostStageMeta(hostStageFromStatus(createStatus) || "to_contact").label}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-[#9AA3BD]">
                ✕
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-[#9AA3BD] sm:col-span-2">
                SIRET
                <input
                  value={siret}
                  onChange={(event) => void lookupSiret(event.target.value)}
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="14 chiffres"
                  className={`${fieldClass} mt-1`}
                />
                {lookup ? <span className="mt-1 block text-[11px] text-[#A99BFF]">{lookup}</span> : null}
              </label>
              <label className="block text-xs font-semibold text-[#9AA3BD] sm:col-span-2">
                Entreprise
                <input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  onBlur={() => setCompanyName(formatCompanyName(companyName))}
                  required
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label className="block text-xs font-semibold text-[#9AA3BD]">
                Prénom
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  onBlur={() => setFirstName(formatPersonName(firstName))}
                  required
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label className="block text-xs font-semibold text-[#9AA3BD]">
                Nom
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  onBlur={() => setLastName(formatPersonName(lastName))}
                  required
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label className="block text-xs font-semibold text-[#9AA3BD]">
                E-mail
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className={`${fieldClass} mt-1`} />
              </label>
              <label className="block text-xs font-semibold text-[#9AA3BD]">
                Téléphone
                <input value={phone} onChange={(event) => setPhone(event.target.value)} className={`${fieldClass} mt-1`} />
              </label>
              <label className="block text-xs font-semibold text-[#9AA3BD]">
                Postes
                <input
                  value={quantity}
                  onChange={(event) => setQuantity(Math.min(30, Math.max(1, Number(event.target.value) || 1)))}
                  type="number"
                  min={1}
                  max={30}
                  required
                  className={`${fieldClass} mt-1`}
                />
              </label>
              <label className="block text-xs font-semibold text-[#9AA3BD] sm:col-span-2">
                Cursus
                <select value={track1} onChange={(event) => setTrack1(event.target.value)} required className={`${fieldClass} mt-1`}>
                  <option value="">Choisir le cursus</option>
                  {CFA_SPECIALIZATIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-sm text-[#9AA3BD]">
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Création…" : "Créer"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {lostCompany ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-[#0A0F1E]/85 p-4">
          <form
            className="w-full max-w-md rounded-[24px] border border-[#1A2340] bg-[#111831] p-5"
            onSubmit={(event) => {
              event.preventDefault();
              const company = lostCompany;
              setLostCompany(null);
              void changeStatus(company, "not_recruited", lostReason);
            }}
          >
            <h2 className="text-lg font-extrabold">Marquer non recruté</h2>
            <label className="mt-3 block text-xs font-semibold text-[#9AA3BD]">
              Motif
              <textarea
                required
                value={lostReason}
                onChange={(event) => setLostReason(event.target.value)}
                className="mt-1 min-h-24 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="px-4 text-sm text-[#9AA3BD]" onClick={() => setLostCompany(null)}>
                Annuler
              </button>
              <button type="submit" className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white">
                Confirmer
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function StageColumn({
  stageId,
  companies,
  columnRef,
  onAdd,
  onOpen,
  onAction,
  menuId,
  setMenuId,
  onMove,
  readOnly,
}: {
  stageId: CfaHostStageId;
  companies: CfaCompany[];
  columnRef: (el: HTMLDivElement | null) => void;
  onAdd: () => void;
  onOpen: (c: CfaCompany) => void;
  onAction: (c: CfaCompany, e: React.MouseEvent) => void;
  menuId: string | null;
  setMenuId: (id: string | null) => void;
  onMove: (c: CfaCompany, status: CfaCompanyStatus) => void;
  readOnly: boolean;
}) {
  const stage = hostStageMeta(stageId);
  const { setNodeRef, isOver } = useDroppable({ id: `stage:${stageId}` });
  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        columnRef(el);
      }}
      className="flex w-[262px] shrink-0 flex-col rounded-[22px] border border-[#1A2340] bg-[#0D1326] p-3"
      style={{ boxShadow: isOver ? `inset 0 0 0 1px ${stage.color}` : undefined }}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
        <span className="text-sm font-extrabold text-[#F2F4FA]">{stage.label}</span>
        <span className="ml-auto rounded-full bg-[#1A2340] px-2 py-0.5 text-[11px] font-semibold text-[#9AA3BD]">
          {companies.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        {companies.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-[#2E3860] px-3 py-8 text-center text-xs text-[#6C7593]">
            {stage.emptyHint}
          </div>
        ) : (
          companies.map((company) => (
            <DraggableCard
              key={company.id}
              company={company}
              onOpen={onOpen}
              onAction={onAction}
              menuId={menuId}
              setMenuId={setMenuId}
              onMove={onMove}
            />
          ))
        )}
      </div>
      {readOnly ? null : (
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 rounded-full border border-[#26304F] px-3 py-2 text-sm font-semibold text-[#9AA3BD] hover:text-[#F2F4FA]"
        >
          ＋ Ajouter
        </button>
      )}
    </div>
  );
}

function DraggableCard({
  company,
  onOpen,
  onAction,
  menuId,
  setMenuId,
  onMove,
}: {
  company: CfaCompany;
  onOpen: (c: CfaCompany) => void;
  onAction: (c: CfaCompany, e: React.MouseEvent) => void;
  menuId: string | null;
  setMenuId: (id: string | null) => void;
  onMove: (c: CfaCompany, status: CfaCompanyStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: company.id,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <CompanyCard
        company={company}
        onOpen={onOpen}
        onAction={onAction}
        menuId={menuId}
        setMenuId={setMenuId}
        onMove={onMove}
      />
    </div>
  );
}

function CompanyCard({
  company,
  onOpen,
  onAction,
  menuId,
  setMenuId,
  onMove,
  overlay,
}: {
  company: CfaCompany;
  onOpen?: (c: CfaCompany) => void;
  onAction?: (c: CfaCompany, e: React.MouseEvent) => void;
  menuId?: string | null;
  setMenuId?: (id: string | null) => void;
  onMove?: (c: CfaCompany, status: CfaCompanyStatus) => void;
  overlay?: boolean;
}) {
  const name = formatCompanyName(company.company_name);
  const contact = contactLabel(company);
  const place = citySector(company);
  const posts = company.apprentices_wanted ?? 0;
  const track = company.apprentice_track_1;
  const trackLabel = track ? getCfaSpecializationLabel(track) : null;
  const meta = footerMeta(company);
  const action = primaryAction(company);
  const overdue = meta.overdue;

  return (
    <article
      onClick={() => onOpen?.(company)}
      className="cursor-pointer rounded-[18px] border bg-[#111831] p-[15px]"
      style={{
        borderColor: overdue ? "#FF5D7355" : "#1A2340",
        boxShadow: overlay ? "0 12px 40px rgba(0,0,0,0.45)" : undefined,
      }}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full text-[11px] font-extrabold text-white"
          style={{ background: avatarGradient(company.id) }}
        >
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-extrabold text-[#F2F4FA]">{name}</p>
          {place ? <p className="truncate text-xs text-[#9AA3BD]">{place}</p> : null}
        </div>
        <div className="relative">
          <button
            type="button"
            aria-label="Actions"
            className="grid h-7 w-7 place-items-center rounded-full text-[#6C7593]"
            onClick={(e) => {
              e.stopPropagation();
              setMenuId?.(menuId === company.id ? null : company.id);
            }}
          >
            ⋯
          </button>
          {menuId === company.id ? (
            <div className="absolute right-0 top-8 z-20 w-48 rounded-2xl border border-[#26304F] bg-[#0B1122] p-2 text-xs shadow-xl">
              <p className="px-2 py-1 text-[10px] font-semibold text-[#6C7593]">Déplacer vers…</p>
              {CFA_HOST_STAGES.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  className="block w-full rounded-xl px-2 py-1.5 text-left hover:bg-[#151C33]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuId?.(null);
                    onMove?.(company, dbStatusForHostStage(stage.id));
                  }}
                >
                  {stage.label}
                </button>
              ))}
              <button
                type="button"
                className="mt-1 block w-full rounded-xl px-2 py-1.5 text-left text-[#FF8A9B] hover:bg-[#151C33]"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuId?.(null);
                  onMove?.(company, "not_recruited");
                }}
              >
                Non recrutement
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <p className="mt-3 truncate text-xs text-[#9AA3BD]">
        {contact ? `☺ ${contact}` : <span className="text-[#6C7593]">Contact à trouver</span>}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {posts > 0 ? (
          <span className="rounded-full bg-[#1A2340] px-2.5 py-0.5 text-[11px] font-semibold text-[#C9D2E8]">
            {posts} poste{posts > 1 ? "s" : ""}
          </span>
        ) : null}
        {trackLabel ? (
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: `${trackColor(track)}22`, color: trackColor(track) }}
          >
            {trackLabel}
          </span>
        ) : (
          <span className="rounded-full bg-[#1A2340] px-2.5 py-0.5 text-[11px] font-semibold text-[#6C7593]">
            Cursus à définir
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#1A2340] pt-2.5">
        {meta.text ? (
          <p className="truncate text-[11px]" style={{ color: overdue ? "#FF8A9B" : "#6C7593" }}>
            {meta.text}
          </p>
        ) : (
          <span />
        )}
        {action ? (
          <button
            type="button"
            onClick={(e) => onAction?.(company, e)}
            className="shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold"
            style={{
              background:
                action.tone === "red"
                  ? "#FF5D731A"
                  : action.tone === "amber"
                    ? "#F2CF6B22"
                    : action.tone === "teal"
                      ? "#5EDCC322"
                      : "#8DB8FF22",
              color:
                action.tone === "red"
                  ? "#FF8A9B"
                  : action.tone === "amber"
                    ? "#F2CF6B"
                    : action.tone === "teal"
                      ? "#5EDCC3"
                      : "#8DB8FF",
              border: action.tone === "red" ? "1px solid #FF8A9B55" : undefined,
            }}
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function ListView({
  companies,
  onOpen,
  onAction,
  menuId,
  setMenuId,
  onMove,
}: {
  companies: CfaCompany[];
  onOpen: (c: CfaCompany) => void;
  onAction: (c: CfaCompany, e: React.MouseEvent) => void;
  menuId: string | null;
  setMenuId: (id: string | null) => void;
  onMove: (c: CfaCompany, status: CfaCompanyStatus) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-[#1A2340] bg-[#111831]">
      <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,.9fr)_minmax(0,1fr)_minmax(0,1fr)_120px] gap-2 px-4 py-3 text-[12.5px] font-extrabold text-[#6C7593]">
        <span>Entreprise</span>
        <span>Contact</span>
        <span>Étape</span>
        <span>Postes / cursus</span>
        <span>Dernière action</span>
        <span>Action</span>
      </div>
      {companies.length === 0 ? (
        <p className="border-t border-[#1A2340] px-4 py-8 text-center text-sm text-[#6C7593]">
          Aucune entreprise pour ces filtres.
        </p>
      ) : (
        companies.map((company) => {
          const stageId = hostStageFromStatus(company.status);
          const stage = stageId ? hostStageMeta(stageId) : null;
          const meta = footerMeta(company);
          const action = primaryAction(company);
          return (
            <div
              key={company.id}
              className="grid cursor-pointer grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,.9fr)_minmax(0,1fr)_minmax(0,1fr)_120px] items-center gap-2 border-t border-[#1A2340] px-4 py-3 text-sm"
              onClick={() => onOpen(company)}
            >
              <span className="truncate font-semibold">{formatCompanyName(company.company_name)}</span>
              <span className="truncate text-[#9AA3BD]">{contactLabel(company) || "Contact à trouver"}</span>
              <span>
                {stage ? (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{ background: `${stage.color}22`, color: stage.color }}
                  >
                    {stage.label}
                  </span>
                ) : (
                  "—"
                )}
              </span>
              <span className="truncate text-[#9AA3BD]">
                {company.apprentices_wanted ? `${company.apprentices_wanted} poste(s)` : "—"}
                {company.apprentice_track_1
                  ? ` · ${getCfaSpecializationLabel(company.apprentice_track_1)}`
                  : ""}
              </span>
              <span className="truncate text-xs" style={{ color: meta.overdue ? "#FF8A9B" : "#6C7593" }}>
                {meta.text || "—"}
              </span>
              <span className="relative flex items-center gap-1">
                {action ? (
                  <button
                    type="button"
                    className="rounded-full bg-[#8DB8FF22] px-2.5 py-1 text-[11px] font-semibold text-[#8DB8FF]"
                    onClick={(e) => onAction(company, e)}
                  >
                    {action.label}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="text-[#6C7593]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuId(menuId === company.id ? null : company.id);
                  }}
                >
                  ⋯
                </button>
                {menuId === company.id ? (
                  <span className="absolute right-0 top-7 z-20 w-44 rounded-2xl border border-[#26304F] bg-[#0B1122] p-2 text-xs">
                    {CFA_HOST_STAGES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="block w-full rounded-xl px-2 py-1 text-left"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuId(null);
                          onMove(company, dbStatusForHostStage(s.id));
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </span>
                ) : null}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
