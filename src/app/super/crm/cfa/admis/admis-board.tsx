"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { FilterPill, PageTitle, ViewSwitch } from "@/components/control/cfa-board-chrome";
import { EmptyState } from "@/components/control/chrome";
import { formatCompanyName, formatPersonName } from "@/lib/cfa/format-org-name";
import {
  getCfaSpecializationFullLabel,
  getCfaSpecializationLabel,
  type CfaApplication,
} from "@/lib/cfa-applications";

type Company = {
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
};

type Curriculum = { id: string; name: string; code: string | null };
type ViewMode = "list" | "card" | "cursus";

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

function staffValue(student: CfaApplication, key: string): string {
  return String(student.cerfa_data?.[key] ?? "");
}

function readUrl(): { view: ViewMode; q: string } {
  if (typeof window === "undefined") return { view: "list", q: "" };
  const url = new URL(window.location.href);
  const raw = url.searchParams.get("view");
  const view: ViewMode = raw === "card" || raw === "cursus" ? raw : "list";
  return { view, q: url.searchParams.get("aq") || "" };
}

function writeUrl(state: { view: ViewMode; q: string }) {
  const url = new URL(window.location.href);
  if (state.view === "list") url.searchParams.delete("view");
  else url.searchParams.set("view", state.view);
  if (!state.q.trim()) url.searchParams.delete("aq");
  else url.searchParams.set("aq", state.q);
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

function statusLabel(student: CfaApplication) {
  if (student.status === "contract") return "Contrat";
  if (student.status === "admitted") return "Admis";
  return student.status;
}

function hostLabel(student: CfaApplication, companies: Company[]) {
  if (student.placement?.companyName) return formatCompanyName(student.placement.companyName);
  const hostId = staffValue(student, "_staff_host_company_id");
  const host = companies.find((company) => company.id === hostId);
  return host ? formatCompanyName(host.company_name) : "";
}

export function AdmisBoard() {
  const router = useRouter();
  const initial = readUrl();
  const [students, setStudents] = useState<CfaApplication[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [view, setView] = useState<ViewMode>(initial.view);
  const [query, setQuery] = useState(initial.q);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/super/cfa/admis", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Chargement impossible");
      setStudents(payload.students ?? []);
      setCompanies(payload.companies ?? []);
      setCurricula(payload.curricula ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    writeUrl({ view, q: query });
  }, [view, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) => {
      const name = `${student.first_name} ${student.last_name}`.toLowerCase();
      const spec = getCfaSpecializationFullLabel(student.specialization).toLowerCase();
      const cursus = curricula.find((item) => item.id === staffValue(student, "_staff_curriculum_id"));
      return (
        name.includes(q) ||
        student.email.toLowerCase().includes(q) ||
        spec.includes(q) ||
        (cursus?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [students, query, curricula]);

  const groups = useMemo(() => {
    const assigned = new Map<string, CfaApplication[]>();
    for (const curriculum of curricula) assigned.set(curriculum.id, []);
    const unassigned: CfaApplication[] = [];
    for (const student of filtered) {
      const id = staffValue(student, "_staff_curriculum_id");
      if (id && assigned.has(id)) assigned.get(id)!.push(student);
      else unassigned.push(student);
    }
    const rows = curricula
      .map((curriculum) => ({
        id: curriculum.id,
        name: curriculum.name,
        code: curriculum.code,
        students: assigned.get(curriculum.id) ?? [],
      }))
      .filter((group) => group.students.length > 0);
    if (unassigned.length) {
      rows.push({ id: "none", name: "Sans cursus", code: null, students: unassigned });
    }
    return rows;
  }, [filtered, curricula]);

  async function saveStaff(id: string, patch: { curriculumId?: string; companyId?: string }) {
    const student = students.find((item) => item.id === id);
    if (!student) return;
    setMessage("");
    const response = await fetch("/api/super/cfa/admis", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(payload.error || "Enregistrement impossible");
      return;
    }
    if (patch.curriculumId) {
      const assigned = await fetch("/api/super/cfa/cursus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign_learner", email: student.email, curriculumId: patch.curriculumId }),
      });
      const assignedPayload = await assigned.json().catch(() => ({}));
      if (!assigned.ok) {
        setMessage(assignedPayload.error || "Cursus enregistré sur le dossier. Le compte apprenant n'est pas encore relié.");
      }
    }
    await load();
  }

  function openStudent(student: CfaApplication) {
    router.push(`/super/crm/cfa/apprenants/${student.id}`);
  }

  const selectClass =
    "h-9 w-full rounded-xl border border-[#26304F] bg-[#0B1122] px-2 text-xs text-[#EEF1F8]";

  function CursusSelect({ student, stopClick }: { student: CfaApplication; stopClick?: boolean }) {
    return (
      <select
        value={staffValue(student, "_staff_curriculum_id")}
        onClick={(event) => {
          if (stopClick) event.stopPropagation();
        }}
        onChange={(event) => {
          event.stopPropagation();
          void saveStaff(student.id, { curriculumId: event.target.value });
        }}
        className={selectClass}
        aria-label="Cursus"
      >
        <option value="">Choisir un cursus</option>
        {curricula.map((curriculum) => (
          <option key={curriculum.id} value={curriculum.id}>
            {curriculum.name}
            {curriculum.code ? ` (${curriculum.code})` : ""}
          </option>
        ))}
      </select>
    );
  }

  function CompanySelect({ student, stopClick }: { student: CfaApplication; stopClick?: boolean }) {
    return (
      <select
        value={staffValue(student, "_staff_host_company_id")}
        onClick={(event) => {
          if (stopClick) event.stopPropagation();
        }}
        onChange={(event) => {
          event.stopPropagation();
          void saveStaff(student.id, { companyId: event.target.value });
        }}
        className={selectClass}
        aria-label="Entreprise d'accueil"
      >
        <option value="">Entreprise d&apos;accueil</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {formatCompanyName(company.company_name)}
          </option>
        ))}
      </select>
    );
  }

  function StudentMeta({ student }: { student: CfaApplication }) {
    const company = hostLabel(student, companies);
    return (
      <p className="truncate text-xs text-[#9AA3BD]">
        {getCfaSpecializationLabel(student.specialization)}
        {company ? ` · ${company}` : " · En recherche"}
        {` · ${statusLabel(student)}`}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-[1240px] space-y-5 px-6 py-8 text-[#F2F4FA]">
      <PageTitle
        title="Apprentis"
        subtitle={`${students.length} apprenti${students.length > 1 ? "s" : ""} admis ou en contrat`}
        actions={
          <ViewSwitch
            value={view}
            onChange={setView}
            options={[
              { id: "list", label: "Liste" },
              { id: "card", label: "Cartes" },
              { id: "cursus", label: "Cursus" },
            ]}
          />
        }
      />

      {message ? <p className="text-sm text-[#FF8A9B]">{message}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <FilterPill active={!query} count={students.length} onClick={() => setQuery("")}>
          Tous
        </FilterPill>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un apprenti, un cursus…"
          className="h-9 min-w-[240px] flex-1 rounded-full border border-[#26304F] bg-[#0B1122] px-4 text-sm text-[#EEF1F8] outline-none"
        />
      </div>

      {loading ? (
        <div className="h-28 animate-pulse rounded-[26px] bg-[#111831]" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={students.length === 0 ? "Aucun apprenti pour l'instant" : "Aucun résultat pour cette recherche"}
          action={
            students.length === 0 ? undefined : (
              <button
                type="button"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]"
                onClick={() => setQuery("")}
              >
                Voir tous les apprentis
              </button>
            )
          }
        />
      ) : view === "list" ? (
        <div className="overflow-hidden rounded-[24px] border border-[#1A2340] bg-[#111831]">
          <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_90px] gap-3 px-[22px] py-3 text-[12.5px] font-extrabold text-[#6C7593]">
            <span>Apprenti</span>
            <span>Cursus</span>
            <span>Entreprise</span>
            <span>Statut</span>
          </div>
          {filtered.map((student) => {
            const name = formatPersonName(`${student.first_name} ${student.last_name}`);
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => openStudent(student)}
                className="grid w-full grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_90px] items-center gap-3 border-t border-[#1A2340] px-[22px] py-[16px] text-left"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[14px] text-xs font-extrabold text-white"
                    style={{ background: avatarGradient(student.id) }}
                  >
                    {initials(name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-extrabold text-[#F2F4FA]">{name}</span>
                    <span className="block truncate text-xs text-[#9AA3BD]">
                      {getCfaSpecializationFullLabel(student.specialization)}
                    </span>
                  </span>
                </span>
                <span onClick={(event) => event.stopPropagation()}>
                  <CursusSelect student={student} />
                </span>
                <span onClick={(event) => event.stopPropagation()}>
                  <CompanySelect student={student} />
                </span>
                <span className="rounded-full bg-[#1A2340] px-2.5 py-1 text-center text-[11px] font-semibold text-[#C9D2E8]">
                  {statusLabel(student)}
                </span>
              </button>
            );
          })}
        </div>
      ) : view === "card" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((student) => {
            const name = formatPersonName(`${student.first_name} ${student.last_name}`);
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => openStudent(student)}
                className="rounded-[22px] border border-[#1A2340] bg-[#111831] p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] text-sm font-extrabold text-white"
                    style={{ background: avatarGradient(student.id) }}
                  >
                    {initials(name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-extrabold">{name}</p>
                    <StudentMeta student={student} />
                  </div>
                </div>
                <div className="mt-3 space-y-2" onClick={(event) => event.stopPropagation()}>
                  <CursusSelect student={student} stopClick />
                  <CompanySelect student={student} stopClick />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {groups.map((group) => (
            <div key={group.id} className="w-[280px] shrink-0 rounded-[22px] border border-[#1A2340] bg-[#0D1326] p-3">
              <div className="mb-3 flex items-center gap-2">
                <span className="min-w-0 truncate text-sm font-extrabold">{group.name}</span>
                <span className="ml-auto rounded-full bg-[#1A2340] px-2 text-[11px] text-[#9AA3BD]">
                  {group.students.length}
                </span>
              </div>
              <div className="space-y-2">
                {group.students.map((student) => {
                  const name = formatPersonName(`${student.first_name} ${student.last_name}`);
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => openStudent(student)}
                      className="w-full rounded-[18px] border border-[#1A2340] bg-[#111831] p-3 text-left"
                    >
                      <p className="truncate text-sm font-semibold">{name}</p>
                      <StudentMeta student={student} />
                      <div className="mt-2" onClick={(event) => event.stopPropagation()}>
                        <CursusSelect student={student} stopClick />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
