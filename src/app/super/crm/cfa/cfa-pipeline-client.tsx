"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageTitle,
  StageStrip,
  FilterPill,
  TestToggle,
  ViewSwitch,
} from "@/components/control/cfa-board-chrome";
import { EmptyState } from "@/components/control/chrome";
import { formatPersonName, formatCompanyName } from "@/lib/cfa/format-org-name";
import {
  ADMISSION_BLOCKED_DAYS,
  ADMISSION_STAGES,
  admissionStageFromStatus,
  admissionStatusColor,
  admissionStatusLabel,
  daysInCurrentStatus,
  missingAdminDocs,
  stageProgressIndex,
  type AdmissionStageId,
} from "@/lib/cfa/admission-stages";
import { hostStageFromStatus, shortFrDate } from "@/lib/cfa/host-company-stages";
import { getCfaSpecializationLabel, type CfaApplication } from "@/lib/cfa-applications";
import { looksLikeTestAccount } from "@/lib/control/test-account";

type HostCompany = {
  id: string;
  company_name: string;
  status: string;
  apprentices_wanted: number | null;
  apprentice_track_1: string | null;
  next_action_at?: string | null;
  city?: string | null;
};

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

function isTestApp(item: CfaApplication) {
  return looksLikeTestAccount({
    email: item.email,
    name: `${item.first_name} ${item.last_name}`,
  });
}

function isBlocked(item: CfaApplication) {
  if (item.status === "rejected" || item.status === "admitted" || item.status === "contract") return false;
  const days = daysInCurrentStatus(item.updated_at);
  return days != null && days > ADMISSION_BLOCKED_DAYS;
}

function readUrl() {
  if (typeof window === "undefined") {
    return { filter: "all", stage: "all", q: "", showTest: false, view: "list" as const };
  }
  const url = new URL(window.location.href);
  return {
    filter: url.searchParams.get("afilter") || "all",
    stage: url.searchParams.get("astage") || "all",
    q: url.searchParams.get("aq") || "",
    showTest: url.searchParams.get("test") === "1",
    view: url.searchParams.get("view") === "board" ? ("board" as const) : ("list" as const),
  };
}

function writeUrl(state: {
  filter: string;
  stage: string;
  q: string;
  showTest: boolean;
  view: "list" | "board";
}) {
  const url = new URL(window.location.href);
  if (state.filter === "all") url.searchParams.delete("afilter");
  else url.searchParams.set("afilter", state.filter);
  if (state.stage === "all") url.searchParams.delete("astage");
  else url.searchParams.set("astage", state.stage);
  if (!state.q.trim()) url.searchParams.delete("aq");
  else url.searchParams.set("aq", state.q);
  if (!state.showTest) url.searchParams.delete("test");
  else url.searchParams.set("test", "1");
  if (state.view === "list") url.searchParams.delete("view");
  else url.searchParams.set("view", "board");
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

export function CfaPipelineClient({
  apiPath = "/api/super-admin/crm/cfa",
  readOnly = false,
}: {
  apiPath?: string;
  readOnly?: boolean;
} = {}) {
  const router = useRouter();
  const initial = readUrl();
  const [applications, setApplications] = useState<CfaApplication[]>([]);
  const [companies, setCompanies] = useState<HostCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [view, setView] = useState<"list" | "board">(initial.view);
  const [filter, setFilter] = useState(initial.filter);
  const [stageFilter, setStageFilter] = useState(initial.stage);
  const [query, setQuery] = useState(initial.q);
  const [showTests, setShowTests] = useState(initial.showTest);
  const [activeStage, setActiveStage] = useState<string | null>(
    initial.stage !== "all" ? initial.stage : null,
  );
  const [proposeCompany, setProposeCompany] = useState<HostCompany | null>(null);
  const [remindTarget, setRemindTarget] = useState<CfaApplication | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [appsRes, cosRes] = await Promise.all([
        fetch(apiPath, { cache: "no-store" }),
        fetch("/api/super-admin/crm/cfa/companies", { cache: "no-store" }),
      ]);
      const appsJson = await appsRes.json();
      if (!appsRes.ok) throw new Error(appsJson.error || "Chargement impossible");
      setApplications(appsJson.applications ?? []);
      setMigrationRequired(Boolean(appsJson.migrationRequired));
      if (cosRes.ok) {
        const cosJson = await cosRes.json();
        setCompanies(cosJson.companies ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible");
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
    writeUrl({ filter, stage: stageFilter, q: query, showTest: showTests, view });
  }, [filter, stageFilter, query, showTests, view]);

  const tests = useMemo(() => applications.filter(isTestApp), [applications]);
  const pool = useMemo(
    () => (showTests ? applications : applications.filter((item) => !isTestApp(item))),
    [applications, showTests],
  );

  const inProgress = useMemo(
    () => pool.filter((item) => item.status !== "rejected"),
    [pool],
  );
  const rejectedCount = useMemo(
    () => pool.filter((item) => item.status === "rejected").length,
    [pool],
  );
  const blockedPool = useMemo(() => inProgress.filter(isBlocked), [inProgress]);
  const withoutCompany = useMemo(
    () => inProgress.filter((item) => !item.placement && item.status !== "admitted" && item.status !== "contract"),
    [inProgress],
  );
  const admittedPool = useMemo(
    () => pool.filter((item) => item.status === "admitted" || item.status === "contract"),
    [pool],
  );

  const stageCounts = useMemo(() => {
    const map = Object.fromEntries(ADMISSION_STAGES.map((s) => [s.id, 0])) as Record<AdmissionStageId, number>;
    for (const item of pool) {
      const stage = admissionStageFromStatus(item.status);
      if (stage) map[stage] += 1;
    }
    return map;
  }, [pool]);

  const filtered = useMemo(() => {
    return pool.filter((item) => {
      if (filter === "blocked" && !isBlocked(item)) return false;
      if (filter === "no_company" && (item.placement || item.status === "rejected")) return false;
      if (filter === "admitted" && item.status !== "admitted" && item.status !== "contract") return false;
      if (filter === "rejected" && item.status !== "rejected") return false;
      if (filter === "all" && item.status === "rejected") {
        /* keep rejected in "all" */
      }
      if (stageFilter !== "all") {
        const stage = admissionStageFromStatus(item.status);
        if (stage !== stageFilter) return false;
      }
      const hay = `${item.first_name} ${item.last_name} ${item.email}`.toLowerCase();
      return hay.includes(query.trim().toLowerCase());
    });
  }, [pool, filter, stageFilter, query]);

  const recruitingCompanies = useMemo(() => {
    return companies.filter((company) => {
      if (looksLikeTestAccount({ email: null, name: company.company_name })) return false;
      const stage = hostStageFromStatus(company.status);
      if (stage !== "creating_offer" && stage !== "recruiting") return false;
      return (company.apprentices_wanted ?? 0) > 0;
    });
  }, [companies]);

  const showRecruitingBlock =
    withoutCompany.length > 0 &&
    recruitingCompanies.length > 0 &&
    !readOnly;

  function openApp(item: CfaApplication) {
    router.push(`/super/crm/cfa/apprenants/${item.id}`);
  }

  function nextAction(item: CfaApplication): { label: string; tone: "red" | "amber" | "violet" | "neutral" } {
    const missing = missingAdminDocs(item.administrative_documents);
    if (isBlocked(item) || missing.length) return { label: "Relancer", tone: "red" };
    if (item.status === "review") return { label: "Relire", tone: "amber" };
    if (item.status === "interview") return { label: "Planifier", tone: "violet" };
    return { label: "Voir le dossier", tone: "neutral" };
  }

  function runNextAction(item: CfaApplication, e: React.MouseEvent) {
    e.stopPropagation();
    const action = nextAction(item);
    if (action.label === "Relancer") {
      setRemindTarget(item);
      return;
    }
    openApp(item);
  }

  return (
    <div className="mx-auto max-w-[1240px] space-y-5 px-6 py-8 text-[#F2F4FA]">
      <PageTitle
        title="Admissions"
        subtitle={`${inProgress.length} candidature${inProgress.length > 1 ? "s" : ""} en cours · ${blockedPool.length} bloquée${blockedPool.length > 1 ? "s" : ""} depuis plus de 30 jours`}
        actions={<ViewSwitch value={view === "board" ? "board" : "list"} onChange={setView} boardLabel="Tableau" listLabel="Liste" />}
      />

      {migrationRequired ? (
        <p className="rounded-[24px] border border-[#3A3320] bg-[#15182A] px-4 py-3 text-sm text-[#F2CF6B]">
          Les candidatures ne sont pas encore activées.
        </p>
      ) : null}
      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}

      <StageStrip
        title="Parcours d'admission"
        meta={`${rejectedCount} non retenu${rejectedCount > 1 ? "s" : ""} · comptes de test exclus`}
        activeId={activeStage}
        items={ADMISSION_STAGES.map((stage) => ({
          id: stage.id,
          label: stage.label,
          count: stageCounts[stage.id],
          color: stage.color,
        }))}
        onSelect={(id) => {
          setActiveStage(id);
          setStageFilter(id);
          setFilter("all");
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterPill active={filter === "all" && stageFilter === "all"} count={pool.length} onClick={() => { setFilter("all"); setStageFilter("all"); setActiveStage(null); }}>
          Tous
        </FilterPill>
        <FilterPill active={filter === "blocked"} count={blockedPool.length} onClick={() => { setFilter("blocked"); setStageFilter("all"); setActiveStage(null); }}>
          Bloqués
        </FilterPill>
        <FilterPill active={filter === "no_company"} count={withoutCompany.length} onClick={() => { setFilter("no_company"); setStageFilter("all"); setActiveStage(null); }}>
          Sans entreprise
        </FilterPill>
        <FilterPill active={filter === "admitted"} count={admittedPool.length} onClick={() => { setFilter("admitted"); setStageFilter("all"); setActiveStage(null); }}>
          Admis
        </FilterPill>
        <FilterPill active={filter === "rejected"} count={rejectedCount} onClick={() => { setFilter("rejected"); setStageFilter("all"); setActiveStage(null); }}>
          Non retenus
        </FilterPill>
        <select
          value={stageFilter}
          onChange={(e) => {
            const next = e.target.value;
            setStageFilter(next);
            setFilter("all");
            setActiveStage(next === "all" ? null : next);
          }}
          className="rounded-full border border-[#26304F] bg-[#111831] px-3 py-1.5 text-sm text-[#B7BED3]"
        >
          <option value="all">Toutes les étapes</option>
          {ADMISSION_STAGES.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.label}
            </option>
          ))}
        </select>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="⌕ Rechercher un candidat"
            className="w-[230px] rounded-full border border-[#26304F] bg-[#0B1122] px-4 py-2 text-sm outline-none placeholder:text-[#6C7593]"
          />
          <TestToggle checked={showTests} count={tests.length} onChange={setShowTests} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 rounded-[24px] border border-[#1A2340] bg-[#111831] p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-[#0B1122]" />
          ))}
        </div>
      ) : view === "board" ? (
        <BoardView applications={filtered} onOpen={openApp} />
      ) : filtered.length === 0 ? (
        pool.length === 0 ? (
          <EmptyState
            title="Aucune candidature pour l'instant"
            action={
              <Link href="/ecole/candidater" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]">
                Formulaire public d&apos;admission
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="Aucun résultat pour ce filtre"
            action={
              <button
                type="button"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]"
                onClick={() => {
                  setFilter("all");
                  setStageFilter("all");
                  setQuery("");
                  setActiveStage(null);
                }}
              >
                Voir toutes les candidatures
              </button>
            }
          />
        )
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-[#1A2340] bg-[#111831]">
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.7fr)_minmax(0,1fr)_170px] gap-3 px-[22px] py-3 text-[12.5px] font-extrabold text-[#6C7593]">
            <span>Candidat</span>
            <span>Où il en est</span>
            <span>Entreprise d&apos;accueil</span>
            <span>Prochaine action</span>
          </div>
          {filtered.map((item) => {
            const name = formatPersonName(`${item.first_name} ${item.last_name}`);
            const days = daysInCurrentStatus(item.updated_at);
            const blocked = isBlocked(item);
            const color = admissionStatusColor(item.status);
            const label = admissionStatusLabel(item.status);
            const progress = stageProgressIndex(item.status);
            const missing = missingAdminDocs(item.administrative_documents);
            const action = nextAction(item);
            const track = getCfaSpecializationLabel(item.specialization);
            const created = shortFrDate(item.created_at);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openApp(item)}
                className="grid w-full grid-cols-[minmax(0,1.2fr)_minmax(0,1.7fr)_minmax(0,1fr)_170px] items-center gap-3 border-t border-[#1A2340] px-[22px] py-[18px] text-left"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[14px] text-xs font-extrabold text-white"
                    style={{ background: avatarGradient(item.id) }}
                  >
                    {initials(name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-extrabold text-[#F2F4FA]">{name}</span>
                    <span className="block truncate text-xs text-[#9AA3BD]">
                      {track}
                      {created ? ` · ${created}` : ""}
                    </span>
                  </span>
                </span>

                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-semibold" style={{ color }}>
                      {label}
                    </span>
                    {days != null ? (
                      <span style={{ color: blocked ? "#FF8A9B" : "#6C7593" }}>
                        depuis {days} j
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-2 flex w-[150px] gap-1">
                    {ADMISSION_STAGES.map((stage, index) => (
                      <span
                        key={stage.id}
                        className="h-1.5 flex-1 rounded-full"
                        style={{
                          background: progress >= index ? stage.color : "#1A2340",
                        }}
                      />
                    ))}
                  </span>
                  {missing.length ? (
                    <span
                      className="mt-1.5 block text-xs"
                      style={{ color: blocked ? "#FF8A9B" : "#9AA3BD" }}
                    >
                      Manque : {missing.join(", ")}
                    </span>
                  ) : null}
                </span>

                <span>
                  {!item.placement ? (
                    <span className="rounded-full bg-[#F2CF6B22] px-2.5 py-1 text-[11px] font-semibold text-[#F2CF6B]">
                      En recherche
                    </span>
                  ) : item.placement.status === "pending" ? (
                    <span className="rounded-full bg-[#5EDCC322] px-2.5 py-1 text-[11px] font-semibold text-[#5EDCC3]">
                      {formatCompanyName(item.placement.companyName)} proposée
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#6BE39B22] px-2.5 py-1 text-[11px] font-semibold text-[#6BE39B]">
                      {formatCompanyName(item.placement.companyName)}
                    </span>
                  )}
                </span>

                <span className="flex items-center justify-end gap-2">
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => runNextAction(item, e)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") runNextAction(item, e as unknown as React.MouseEvent);
                    }}
                    className="rounded-full px-3 py-1 text-[11px] font-semibold"
                    style={{
                      background:
                        action.tone === "red"
                          ? "#FF5D731A"
                          : action.tone === "amber"
                            ? "#F2CF6B22"
                            : action.tone === "violet"
                              ? "#6E5BFF22"
                              : "#1A2340",
                      color:
                        action.tone === "red"
                          ? "#FF8A9B"
                          : action.tone === "amber"
                            ? "#F2CF6B"
                            : action.tone === "violet"
                              ? "#A99BFF"
                              : "#C9D2E8",
                    }}
                  >
                    {action.label}
                  </span>
                  <span className="text-[#6C7593]">›</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      {showRecruitingBlock ? (
        <section
          className="rounded-[24px] border border-[#1A2340] p-5"
          style={{
            background: "linear-gradient(180deg, #5EDCC312 0%, #111831 48%)",
            borderTop: "3px solid #5EDCC3",
          }}
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-[17px] font-extrabold text-[#F2F4FA]">Entreprises qui recrutent</h3>
              <p className="mt-1 text-sm text-[#9AA3BD]">
                Postes ouverts en{" "}
                {stageFilter !== "all" ? "tous cursus" : "tous cursus"}, à proposer aux candidats
                sans entreprise.
              </p>
            </div>
            <Link href="/super/crm/cfa/entreprises" className="text-sm font-semibold text-[#5EDCC3]">
              Voir les entreprises d&apos;accueil ›
            </Link>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recruitingCompanies.slice(0, 8).map((company) => {
              const track = company.apprentice_track_1
                ? getCfaSpecializationLabel(company.apprentice_track_1)
                : null;
              const n = company.apprentices_wanted ?? 0;
              return (
                <div
                  key={company.id}
                  className="flex items-center gap-3 rounded-[18px] border border-[#1A2340] bg-[#0B1122] p-3"
                >
                  <span
                    className="grid h-10 w-10 place-items-center rounded-full text-xs font-extrabold text-white"
                    style={{ background: avatarGradient(company.id) }}
                  >
                    {initials(formatCompanyName(company.company_name))}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#F2F4FA]">
                      {formatCompanyName(company.company_name)}
                    </p>
                    <p className="truncate text-xs text-[#9AA3BD]">
                      {n} poste{n > 1 ? "s" : ""}
                      {track ? ` · ${track}` : ""}
                      {company.next_action_at ? ` · RDV ${shortFrDate(company.next_action_at)}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProposeCompany(company)}
                    className="rounded-full bg-[#5EDCC3] px-3 py-1.5 text-xs font-semibold text-[#0A0F1E]"
                  >
                    Proposer
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {proposeCompany ? (
        <ProposeModal
          company={proposeCompany}
          candidates={withoutCompany.filter(
            (c) =>
              !proposeCompany.apprentice_track_1 ||
              c.specialization === proposeCompany.apprentice_track_1,
          )}
          onClose={() => setProposeCompany(null)}
          onDone={async (message) => {
            setProposeCompany(null);
            setError(message.startsWith("Erreur") ? message : "");
            if (!message.startsWith("Erreur")) await load();
          }}
        />
      ) : null}

      {remindTarget ? (
        <RemindModal
          application={remindTarget}
          onClose={() => setRemindTarget(null)}
          onConfirm={() => {
            const email = remindTarget.email;
            setRemindTarget(null);
            const params = new URLSearchParams({
              to: email,
              name: formatPersonName(`${remindTarget.first_name} ${remindTarget.last_name}`),
            });
            router.push(`/super/crm/emails?${params.toString()}`);
          }}
        />
      ) : null}
    </div>
  );
}

function BoardView({
  applications,
  onOpen,
}: {
  applications: CfaApplication[];
  onOpen: (item: CfaApplication) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-3">
      {ADMISSION_STAGES.map((stage) => {
        const rows = applications.filter((item) => admissionStageFromStatus(item.status) === stage.id);
        return (
          <div key={stage.id} className="w-[240px] shrink-0 rounded-[22px] border border-[#1A2340] bg-[#0D1326] p-3">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: stage.color }} />
              <span className="text-sm font-extrabold">{stage.label}</span>
              <span className="ml-auto rounded-full bg-[#1A2340] px-2 text-[11px] text-[#9AA3BD]">
                {rows.length}
              </span>
            </div>
            <div className="space-y-2">
              {rows.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpen(item)}
                  className="w-full rounded-[18px] border border-[#1A2340] bg-[#111831] p-3 text-left"
                >
                  <p className="truncate text-sm font-semibold">
                    {formatPersonName(`${item.first_name} ${item.last_name}`)}
                  </p>
                  <p className="truncate text-xs text-[#9AA3BD]">
                    {getCfaSpecializationLabel(item.specialization)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProposeModal({
  company,
  candidates,
  onClose,
  onDone,
}: {
  company: HostCompany;
  candidates: CfaApplication[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [candidateId, setCandidateId] = useState(candidates[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0F1E]/85 p-4">
      <div className="w-full max-w-md rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
        <h3 className="text-lg font-extrabold">
          Proposer {formatCompanyName(company.company_name)}
        </h3>
        <p className="mt-1 text-sm text-[#9AA3BD]">
          Choisir un candidat sans entreprise
          {company.apprentice_track_1
            ? ` (${getCfaSpecializationLabel(company.apprentice_track_1)})`
            : ""}
          .
        </p>
        {candidates.length === 0 ? (
          <p className="mt-4 text-sm text-[#F2CF6B]">Aucun candidat sans entreprise pour ce cursus.</p>
        ) : (
          <select
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            className="mt-4 h-10 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm"
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {formatPersonName(`${c.first_name} ${c.last_name}`)} ·{" "}
                {getCfaSpecializationLabel(c.specialization)}
              </option>
            ))}
          </select>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 text-sm text-[#9AA3BD]">
            Annuler
          </button>
          <button
            type="button"
            disabled={!candidateId || busy || candidates.length === 0}
            className="rounded-full bg-[#5EDCC3] px-4 py-2 text-sm font-semibold text-[#0A0F1E] disabled:opacity-50"
            onClick={() => {
              setBusy(true);
              void fetch("/api/super-admin/crm/cfa/placements", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "set_company",
                  applicationId: candidateId,
                  companyId: company.id,
                }),
              })
                .then(async (res) => {
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok) return onDone(`Erreur : ${json.error || "Proposition impossible"}`);
                  onDone("Proposition enregistrée.");
                })
                .finally(() => setBusy(false));
            }}
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

function RemindModal({
  application,
  onClose,
  onConfirm,
}: {
  application: CfaApplication;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0F1E]/85 p-4">
      <div className="w-full max-w-md rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
        <h3 className="text-lg font-extrabold">Relancer le candidat</h3>
        <p className="mt-2 text-sm text-[#9AA3BD]">Destinataire :</p>
        <p className="mt-1 rounded-2xl bg-[#0B1122] px-3 py-2 text-sm text-[#C9D2E8]">
          {application.email}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 text-sm text-[#9AA3BD]">
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-[#FF8A9B] px-4 py-2 text-sm font-semibold text-[#0A0F1E]"
          >
            Ouvrir le composeur
          </button>
        </div>
      </div>
    </div>
  );
}
