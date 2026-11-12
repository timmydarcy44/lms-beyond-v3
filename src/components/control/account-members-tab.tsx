"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DOSSIER_STAGE_COLORS,
  type DossierStage,
} from "@/lib/formation-dossier/stages";
import {
  formatPersonName,
  splitPersonName,
  type AccountMemberPerson,
  type AccountParticipantsPayload,
  type UnlinkedParticipant,
} from "@/lib/control/account-participants-format";
import { roleLabel, roleTone } from "@/lib/roles";
import { EmptyState, SidePanel, Field, fieldClass } from "./chrome";

const VIEW_STORAGE_KEY = "byound.account.members.view";

type FilterId = "all" | "admins" | "staff" | "tutors" | "invites";
type ViewMode = "cards" | "list";

const AVATAR_GRADIENTS = [
  ["#6E5BFF", "#2A1E8F"],
  ["#14836E", "#0B3B36"],
  ["#2F6FD6", "#0E2A5C"],
  ["#B65BFF", "#3B1466"],
  ["#C9A227", "#5A4510"],
  ["#E85D75", "#5A1A28"],
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

function connectedLabel(lastSeenAt: string | null) {
  if (!lastSeenAt) return null;
  const ms = Date.now() - Date.parse(lastSeenAt);
  if (!Number.isFinite(ms) || ms < 0) return null;
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "il y a 1 jour";
  if (days < 14) return `il y a ${days} jours`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `il y a ${weeks} sem.`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
}

function connectionStat(lastSeenAt: string | null) {
  if (!lastSeenAt) return "—";
  const ms = Date.now() - Date.parse(lastSeenAt);
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days <= 0) return "0 j";
  if (days < 14) return `${days} j`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks} sem.`;
  return `${Math.floor(days / 30)} mois`;
}

function isConnectedThisMonth(lastSeenAt: string | null) {
  if (!lastSeenAt) return false;
  const t = Date.parse(lastSeenAt);
  if (!Number.isFinite(t)) return false;
  const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return t >= monthAgo;
}

function rolePill(person: AccountMemberPerson) {
  if (person.invited) {
    return { label: "Invitation", bg: "#3A3118", fg: "#F2CF6B" };
  }
  if (roleTone(person.role) === "admin") {
    const job = person.jobTitle?.trim();
    return {
      label: job ? `Administrateur · ${formatPersonName(job)}` : "Administrateur",
      bg: "#241C3E",
      fg: "#C9C2FF",
    };
  }
  if (person.isTutor) {
    return { label: "Tuteur", bg: "#12352F", fg: "#5EDCC3" };
  }
  return { label: "Collaborateur", bg: "#163228", fg: "#6BE39B" };
}

function memberAction(
  orgId: string,
  body: Record<string, string | boolean | null>,
  onNotice: (message: string) => void,
) {
  const payload = { ...body };
  if (payload.enabled === "true") payload.enabled = true;
  if (payload.enabled === "false") payload.enabled = false;
  return fetch(`/api/super/comptes-clients/${orgId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(async (response) => {
      const json = (await response.json()) as { error?: string };
      onNotice(response.ok ? "Membre mis à jour." : json.error || "Action impossible");
      return response.ok;
    })
    .catch(() => {
      onNotice("Action impossible");
      return false;
    });
}

function readUrlState() {
  if (typeof window === "undefined") {
    return { filter: "all" as FilterId, q: "", view: null as ViewMode | null };
  }
  const url = new URL(window.location.href);
  const filterRaw = url.searchParams.get("mfilter") || "all";
  const filter = (["all", "admins", "staff", "tutors", "invites"] as const).includes(
    filterRaw as FilterId,
  )
    ? (filterRaw as FilterId)
    : "all";
  const q = url.searchParams.get("mq") || "";
  const viewRaw = url.searchParams.get("mview");
  const view = viewRaw === "list" || viewRaw === "cards" ? viewRaw : null;
  return { filter, q, view };
}

function writeUrlState(next: { filter: FilterId; q: string; view: ViewMode }) {
  const url = new URL(window.location.href);
  if (next.filter === "all") url.searchParams.delete("mfilter");
  else url.searchParams.set("mfilter", next.filter);
  if (!next.q.trim()) url.searchParams.delete("mq");
  else url.searchParams.set("mq", next.q);
  url.searchParams.set("mview", next.view);
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}

export function AccountMembersTab({
  organizationId,
  organizationName,
  roleCfa,
  onInvite,
  onImport,
  onNotice,
}: {
  organizationId: string;
  organizationName: string;
  roleCfa: boolean;
  onInvite: (prefill?: { firstName?: string; lastName?: string; email?: string }) => void;
  onImport: () => void;
  onNotice: (message: string) => void;
}) {
  const router = useRouter();
  const initial = readUrlState();
  const [filter, setFilter] = useState<FilterId>(initial.filter);
  const [query, setQuery] = useState(initial.q);
  const [view, setView] = useState<ViewMode>(initial.view || "cards");
  const [payload, setPayload] = useState<AccountParticipantsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [attachTarget, setAttachTarget] = useState<UnlinkedParticipant | null>(null);
  const [bulkInvite, setBulkInvite] = useState(false);
  const [profilePerson, setProfilePerson] = useState<AccountMemberPerson | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/super/comptes-clients/${organizationId}/participants`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Chargement impossible");
      const data = json as AccountParticipantsPayload;
      setPayload(data);
      if (!initial.view) {
        const stored = (() => {
          try {
            const v = window.localStorage.getItem(VIEW_STORAGE_KEY);
            return v === "list" || v === "cards" ? v : null;
          } catch {
            return null;
          }
        })();
        const auto: ViewMode =
          stored || (data.members.length > 12 ? "list" : "cards");
        setView(auto);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [organizationId, initial.view]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    writeUrlState({ filter, q: query, view });
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      /* ignore */
    }
  }, [filter, query, view]);

  const members = payload?.members ?? [];

  const counts = useMemo(() => {
    const admins = members.filter((p) => !p.invited && roleTone(p.role) === "admin").length;
    const staff = members.filter((p) => {
      if (p.invited || roleTone(p.role) === "admin") return false;
      if (roleCfa && p.isTutor) return false;
      return true;
    }).length;
    const tutors = members.filter((p) => p.isTutor).length;
    const invites = members.filter((p) => p.invited).length;
    return { all: members.length, admins, staff, tutors, invites };
  }, [members, roleCfa]);

  const filtered = useMemo(() => {
    return members.filter((person) => {
      if (filter === "admins" && (person.invited || roleTone(person.role) !== "admin")) return false;
      if (filter === "tutors" && !person.isTutor) return false;
      if (filter === "invites" && !person.invited) return false;
      if (filter === "staff") {
        if (person.invited || roleTone(person.role) === "admin") return false;
        if (roleCfa && person.isTutor) return false;
      }
      const hay = `${person.name} ${person.email}`.toLowerCase();
      return hay.includes(query.trim().toLowerCase());
    });
  }, [members, filter, query, roleCfa]);

  const connectedMonth = members.filter((p) => !p.invited && isConnectedThisMonth(p.lastSeenAt)).length;
  const inTraining = members.filter((p) => p.formations.length > 0).length;
  const pendingInvites = members.filter((p) => p.invited).length;

  const summaryParts = [
    `${members.length} membre${members.length > 1 ? "s" : ""}`,
    connectedMonth > 0 ? `${connectedMonth} connecté${connectedMonth > 1 ? "s" : ""} ce mois` : null,
    inTraining > 0 ? `${inTraining} en formation` : null,
    pendingInvites > 0
      ? `${pendingInvites} invitation${pendingInvites > 1 ? "s" : ""} en attente`
      : null,
  ].filter(Boolean);

  const filterItems: Array<{ id: FilterId; label: string; count: number }> = [
    { id: "all", label: "Tous", count: counts.all },
    { id: "admins", label: "Administrateurs", count: counts.admins },
    { id: "staff", label: "Collaborateurs", count: counts.staff },
    ...(roleCfa ? [{ id: "tutors" as const, label: "Tuteurs", count: counts.tutors }] : []),
    { id: "invites", label: "Invitations", count: counts.invites },
  ];

  const filterLabel = filterItems.find((f) => f.id === filter)?.label ?? filter;

  async function runMemberAction(body: Record<string, string | boolean | null>) {
    const ok = await memberAction(organizationId, body, onNotice);
    if (ok) {
      setMenu(null);
      await load();
      router.refresh();
    }
  }

  if (loading) {
    return (
      <div className="mt-5 space-y-4">
        <div className="h-10 animate-pulse rounded-full bg-[#111831]" />
        <p className="text-[13.5px] text-[#9AA3BD]">Chargement des membres…</p>
        <div className="grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-[24px] bg-[#111831]" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !payload) {
    return <EmptyState title={error} />;
  }

  const unlinked = payload?.unlinked ?? [];
  const showEmptyInviteOnly = members.length === 0;

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {filterItems.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className="rounded-full px-3.5 py-1.5 text-sm font-semibold"
                style={{
                  background: active ? "#FFFFFF" : "#111831",
                  color: active ? "#0A0F1E" : "#B7BED3",
                  border: active ? "1px solid #FFFFFF" : "1px solid #1A2340",
                }}
              >
                {item.label} {item.count}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="⌕ Rechercher un membre"
            className="w-[240px] rounded-full border border-[#26304F] bg-[#0B1122] px-4 py-2 text-sm text-[#F2F4FA] outline-none placeholder:text-[#6C7593]"
          />
          <div className="flex overflow-hidden rounded-full border border-[#26304F] bg-[#0B1122]">
            <button
              type="button"
              aria-label="Vue cartes"
              onClick={() => setView("cards")}
              className="px-3 py-1.5 text-sm"
              style={{
                background: view === "cards" ? "#1A2340" : "transparent",
                color: view === "cards" ? "#F2F4FA" : "#6C7593",
              }}
            >
              ▦
            </button>
            <button
              type="button"
              aria-label="Vue liste"
              onClick={() => setView("list")}
              className="px-3 py-1.5 text-sm"
              style={{
                background: view === "list" ? "#1A2340" : "transparent",
                color: view === "list" ? "#F2F4FA" : "#6C7593",
              }}
            >
              ☰
            </button>
          </div>
          <button
            type="button"
            onClick={onImport}
            className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold text-[#E8ECF8]"
          >
            Importer
          </button>
          <button
            type="button"
            onClick={() => onInvite()}
            className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white"
          >
            ＋ Inviter
          </button>
        </div>
      </div>

      <p className="text-[13.5px] text-[#9AA3BD]">{summaryParts.join(" · ")}</p>

      {filtered.length === 0 && members.length > 0 ? (
        <EmptyState
          title={`Aucun membre dans « ${filterLabel} »`}
          action={
            <button
              type="button"
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]"
              onClick={() => setFilter("all")}
            >
              Voir tous les membres
            </button>
          }
        />
      ) : null}

      {view === "cards" ? (
        <div
          className={
            showEmptyInviteOnly && filtered.length === 0
              ? "mx-auto grid max-w-[420px] gap-[18px]"
              : "grid grid-cols-1 gap-[18px] min-[800px]:grid-cols-2 min-[1280px]:grid-cols-3"
          }
        >
          {filtered.map((person) => (
            <MemberCard
              key={person.userId}
              person={person}
              menu={menu}
              setMenu={setMenu}
              onAction={(body) => void runMemberAction(body)}
              onOpenProfile={() => setProfilePerson(person)}
            />
          ))}
          <InviteCard onInvite={() => onInvite()} onImport={onImport} />
        </div>
      ) : filtered.length > 0 ? (
        <div className="overflow-hidden rounded-[24px] border border-[#1A2340] bg-[#111831]">
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,.9fr)_minmax(0,.7fr)_minmax(0,.7fr)_auto] gap-2 px-4 py-3 text-[13px] text-[#6C7593]">
            <span>Membre</span>
            <span>Rôle</span>
            <span>Formations</span>
            <span>Connexion</span>
            <span />
          </div>
          {filtered.map((person) => {
            const pill = rolePill(person);
            return (
              <div
                key={person.userId}
                className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,.9fr)_minmax(0,.7fr)_minmax(0,.7fr)_auto] items-center gap-2 border-t border-[#1A2340] px-4 py-3 text-sm"
              >
                <span className="min-w-0">
                  <span
                    className="mr-2 inline-grid h-9 w-9 place-items-center rounded-[12px] text-xs font-bold text-white"
                    style={{ background: avatarGradient(person.userId) }}
                  >
                    {initials(person.name)}
                  </span>
                  <span className="font-semibold text-[#F2F4FA]">{person.name}</span>
                  <span className="block truncate pl-11 text-xs text-[#8A93AE]">{person.email}</span>
                </span>
                <span
                  className="w-fit rounded-full px-2 py-1 text-xs font-semibold"
                  style={{ background: pill.bg, color: pill.fg }}
                >
                  {pill.label}
                </span>
                <span style={{ color: person.formations.length ? "#8DB8FF" : "#F2F4FA" }}>
                  {person.formations.length}
                </span>
                <span className="text-xs text-[#9AA3BD]">{connectionStat(person.lastSeenAt)}</span>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#A99BFF]"
                  onClick={() => setProfilePerson(person)}
                >
                  Voir ›
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {unlinked.length > 0 ? (
        <UnlinkedBlock
          accountName={organizationName}
          items={unlinked}
          onAttach={(item) => setAttachTarget(item)}
          onInviteOne={(item) => {
            if (item.email) {
              onInvite({
                firstName: item.firstName || splitPersonName(item.name).firstName,
                lastName: item.lastName || splitPersonName(item.name).lastName,
                email: item.email,
              });
            } else {
              onInvite({
                firstName: item.firstName || splitPersonName(item.name).firstName,
                lastName: item.lastName || splitPersonName(item.name).lastName,
              });
            }
          }}
          onInviteAll={() => setBulkInvite(true)}
        />
      ) : null}

      {attachTarget ? (
        <AttachModal
          organizationId={organizationId}
          members={members.filter((m) => !m.invited && !m.userId.startsWith("employee:"))}
          target={attachTarget}
          onClose={() => setAttachTarget(null)}
          onDone={async (message) => {
            onNotice(message);
            setAttachTarget(null);
            await load();
          }}
        />
      ) : null}

      {bulkInvite ? (
        <BulkInviteModal
          organizationId={organizationId}
          items={unlinked.filter((u) => Boolean(u.email))}
          onClose={() => setBulkInvite(false)}
          onDone={async (message) => {
            onNotice(message);
            setBulkInvite(false);
            await load();
          }}
        />
      ) : null}

      {profilePerson ? (
        <SidePanel title={profilePerson.name} onClose={() => setProfilePerson(null)}>
          <p className="mb-3 text-sm text-[#9AA3BD]">{profilePerson.email}</p>
          <p className="mb-4 text-sm text-[#C9D2E8]">{rolePill(profilePerson).label}</p>
          <ul className="space-y-2 text-sm">
            {profilePerson.formations.length === 0 ? (
              <li className="text-[#6C7593]">Aucune formation</li>
            ) : (
              profilePerson.formations.map((f) => (
                <li key={f.dossierId} className="flex justify-between gap-2 border-b border-[#1A2340] pb-2">
                  <span className="text-[#F2F4FA]">{f.title}</span>
                  <span className="shrink-0 text-[#6C7593]">{f.dateLabel || "—"}</span>
                </li>
              ))
            )}
          </ul>
        </SidePanel>
      ) : null}

    </div>
  );
}

function MemberCard({
  person,
  menu,
  setMenu,
  onAction,
  onOpenProfile,
}: {
  person: AccountMemberPerson;
  menu: string | null;
  setMenu: (id: string | null) => void;
  onAction: (body: Record<string, string | boolean | null>) => void;
  onOpenProfile: () => void;
}) {
  const pill = rolePill(person);
  const shown = person.formations.slice(0, 3);
  const extra = Math.max(0, person.formations.length - 3);
  const isAdmin = !person.invited && roleTone(person.role) === "admin";
  const conn = connectedLabel(person.lastSeenAt);
  const footerLeft = person.invited
    ? person.invitedAt
      ? `Invitation envoyée le ${new Date(person.invitedAt).toLocaleDateString("fr-FR")}`
      : "Invitation en attente"
    : conn
      ? `● Connecté ${conn}`
      : "Jamais connecté";
  const footerColor = person.invited || !conn ? "#F2CF6B" : "#6BE39B";

  return (
    <article className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-[22px]">
      <div className="flex items-start gap-3">
        <span
          className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[17px] text-sm font-extrabold text-white"
          style={{ background: avatarGradient(person.userId) }}
        >
          {initials(person.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[17px] font-extrabold leading-tight text-[#F2F4FA]">
                {person.name}
              </p>
              <p className="truncate text-xs text-[#9AA3BD]">{person.email}</p>
            </div>
            <div className="relative">
              <button
                type="button"
                aria-label="Actions"
                onClick={() => setMenu(menu === person.userId ? null : person.userId)}
                className="grid h-8 w-8 place-items-center rounded-full border border-[#26304F] text-[#9AA3BD]"
              >
                ⋯
              </button>
              {menu === person.userId ? (
                <span className="absolute right-0 top-9 z-10 w-52 rounded-2xl border border-[#26304F] bg-[#0B1122] p-2 text-xs shadow-xl">
                  {person.userId.startsWith("employee:") ? null : (
                    <>
                      {(["admin", "learner"] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          className="block w-full rounded-xl px-2 py-1.5 text-left hover:bg-[#151C33]"
                          onClick={() =>
                            onAction({ action: "role", userId: person.userId, role })
                          }
                        >
                          Passer {roleLabel(role).toLowerCase()}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="block w-full rounded-xl px-2 py-1.5 text-left hover:bg-[#151C33]"
                        onClick={() =>
                          onAction({
                            action: "toggle_tutor",
                            userId: person.userId,
                            enabled: person.isTutor ? "false" : "true",
                          })
                        }
                      >
                        {person.isTutor ? "Retirer le rôle tuteur" : "Ajouter le rôle tuteur"}
                      </button>
                    </>
                  )}
                  {person.invited ? (
                    <button
                      type="button"
                      className="block w-full rounded-xl px-2 py-1.5 text-left hover:bg-[#151C33]"
                      onClick={() =>
                        onAction({
                          action: "remind",
                          email: person.email,
                          employeeId: person.employeeId,
                        })
                      }
                    >
                      Renvoyer l&apos;accès
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="block w-full rounded-xl px-2 py-1.5 text-left text-[#FF8E8E] hover:bg-[#151C33]"
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Retirer ${person.name} du compte ? Cette action désactive le membre.`,
                        )
                      ) {
                        return;
                      }
                      onAction({
                        action: "deactivate",
                        employeeId: person.employeeId,
                        userId: person.userId.startsWith("employee:") ? null : person.userId,
                      });
                    }}
                  >
                    Retirer du compte
                  </button>
                </span>
              ) : null}
            </div>
          </div>
          <span
            className="mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: pill.bg, color: pill.fg }}
          >
            {pill.label}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-[#9AA3BD]">
        <span className="rounded-2xl bg-[#0B1122] p-2">
          <span
            className="block text-sm font-extrabold"
            style={{ color: person.formations.length > 0 ? "#8DB8FF" : "#F2F4FA" }}
          >
            {person.formations.length}
          </span>
          formation{person.formations.length > 1 ? "s" : ""}
        </span>
        <span className="rounded-2xl bg-[#0B1122] p-2">
          <span className="block text-sm font-extrabold text-[#F2F4FA]">{person.badges}</span>
          badge{person.badges > 1 ? "s" : ""}
        </span>
        <span className="rounded-2xl bg-[#0B1122] p-2">
          <span className="block text-sm font-extrabold text-[#F2F4FA]">
            {connectionStat(person.lastSeenAt)}
          </span>
          connexion
        </span>
      </div>

      <div className="mt-4 space-y-0">
        {shown.length === 0 ? (
          <p className="text-sm text-[#6C7593]">
            {isAdmin
              ? "Pilote les formations du compte, n’en suit aucune."
              : "Aucune formation pour l’instant."}
          </p>
        ) : (
          shown.map((f, index) => {
            const color =
              (f.stage && DOSSIER_STAGE_COLORS[f.stage as DossierStage]) || "#6C7593";
            return (
              <div
                key={f.dossierId}
                className={`flex items-center gap-2 py-2 text-sm ${index > 0 ? "border-t border-[#1A2340]" : ""}`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
                <span className="min-w-0 flex-1 truncate text-[#F2F4FA]">{f.title}</span>
                {f.dateLabel ? (
                  <span className="shrink-0 text-xs text-[#6C7593]">{f.dateLabel}</span>
                ) : null}
              </div>
            );
          })
        )}
        {extra > 0 ? (
          <p className="pt-1 text-xs text-[#6C7593]">+ {extra} autres</p>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#1A2340] pt-3">
        <p className="text-xs" style={{ color: footerColor }}>
          {footerLeft}
        </p>
        <button
          type="button"
          onClick={onOpenProfile}
          className="shrink-0 text-xs font-semibold text-[#A99BFF]"
        >
          Voir le profil ›
        </button>
      </div>
    </article>
  );
}

function InviteCard({ onInvite, onImport }: { onInvite: () => void; onImport: () => void }) {
  return (
    <article
      className="flex flex-col items-center justify-center rounded-[24px] p-[22px] text-center"
      style={{ border: "1.5px dashed #2E3860", background: "transparent" }}
    >
      <span className="grid h-[52px] w-[52px] place-items-center rounded-full bg-[#6E5BFF]/15 text-xl font-bold text-[#C9C2FF]">
        ＋
      </span>
      <p className="mt-3 text-[17px] font-extrabold text-[#F2F4FA]">Inviter un collaborateur</p>
      <p className="mt-2 max-w-[260px] text-sm text-[#9AA3BD]">
        Il reçoit un lien d&apos;accès à son espace Byound et retrouve ses formations.
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onInvite}
          className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white"
        >
          Inviter
        </button>
        <button
          type="button"
          onClick={onImport}
          className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold text-[#E8ECF8]"
        >
          Importer
        </button>
      </div>
    </article>
  );
}

function UnlinkedBlock({
  accountName,
  items,
  onAttach,
  onInviteOne,
  onInviteAll,
}: {
  accountName: string;
  items: UnlinkedParticipant[];
  onAttach: (item: UnlinkedParticipant) => void;
  onInviteOne: (item: UnlinkedParticipant) => void;
  onInviteAll: () => void;
}) {
  return (
    <section
      className="rounded-[24px] border p-5"
      style={{ background: "#15182A", borderColor: "#3A3320" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F2CF6B]/15 text-sm font-extrabold text-[#F2CF6B]">
            !
          </span>
          <div>
            <h3 className="text-[17px] font-extrabold text-[#F2F4FA]">
              {items.length} participant{items.length > 1 ? "s" : ""} inscrit
              {items.length > 1 ? "s" : ""} sans compte membre
            </h3>
            <p className="mt-1 text-sm text-[#9AA3BD]">
              Ils figurent dans des dossiers de formation mais n&apos;ont pas accès à l&apos;espace{" "}
              {accountName}.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onInviteAll}
          className="rounded-full bg-[#F2CF6B] px-4 py-2 text-sm font-semibold text-[#0A0F1E]"
        >
          Inviter les {items.length}
        </button>
      </div>
      <ul className="mt-4">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2E2A1A] py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#2A2F45] text-xs font-bold text-[#9AA3BD]">
                {initials(item.name)}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-[#F2F4FA]">{item.name}</p>
                <p className="truncate text-xs text-[#9AA3BD]">
                  {item.formations.map((f) => f.title).join(" · ")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onAttach(item)}
                className="rounded-full border border-[#3A3320] px-3 py-1.5 text-xs font-semibold text-[#E8ECF8]"
              >
                Rattacher à un membre
              </button>
              <button
                type="button"
                onClick={() => onInviteOne(item)}
                className="rounded-full bg-[#F2CF6B]/15 px-3 py-1.5 text-xs font-semibold text-[#F2CF6B]"
              >
                Inviter
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AttachModal({
  organizationId,
  members,
  target,
  onClose,
  onDone,
}: {
  organizationId: string;
  members: AccountMemberPerson[];
  target: UnlinkedParticipant;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [memberId, setMemberId] = useState(members[0]?.userId ?? "");
  const [busy, setBusy] = useState(false);
  const selected = members.find((m) => m.userId === memberId);
  const dossierCount = target.dossierIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0F1E]/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
        <h3 className="text-lg font-extrabold text-[#F2F4FA]">Rattacher {target.name}</h3>
        <p className="mt-1 text-sm text-[#9AA3BD]">
          Choisir un membre existant du compte.
        </p>
        <Field label="Membre">
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className={fieldClass}
          >
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        {selected ? (
          <p className="mb-4 rounded-2xl bg-[#0B1122] px-3 py-2 text-sm text-[#C9D2E8]">
            {dossierCount} dossier{dossierCount > 1 ? "s" : ""} seront rattaché
            {dossierCount > 1 ? "s" : ""} à {selected.name}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#26304F] px-4 py-2 text-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!memberId || busy}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E] disabled:opacity-50"
            onClick={() => {
              setBusy(true);
              void fetch(`/api/super/comptes-clients/${organizationId}/participants`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "attach",
                  memberUserId: memberId,
                  participantIds: target.participantIds,
                }),
              })
                .then(async (res) => {
                  const json = (await res.json()) as { error?: string; attached?: number };
                  if (!res.ok) return onDone(json.error || "Rattachement impossible");
                  onDone(`${json.attached ?? 0} dossier(s) rattaché(s).`);
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

function BulkInviteModal({
  organizationId,
  items,
  onClose,
  onDone,
}: {
  organizationId: string;
  items: UnlinkedParticipant[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const emails = items.map((i) => i.email).filter(Boolean) as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0F1E]/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
        <h3 className="text-lg font-extrabold text-[#F2F4FA]">
          Inviter les {items.length} participant{items.length > 1 ? "s" : ""}
        </h3>
        <p className="mt-2 text-sm text-[#9AA3BD]">E-mails destinataires :</p>
        <ul className="mt-2 max-h-40 overflow-auto rounded-2xl bg-[#0B1122] px-3 py-2 text-sm text-[#C9D2E8]">
          {emails.length ? (
            emails.map((email) => <li key={email}>{email}</li>)
          ) : (
            <li className="text-[#F2CF6B]">Aucun e-mail disponible</li>
          )}
        </ul>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#26304F] px-4 py-2 text-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!emails.length || busy}
            className="rounded-full bg-[#F2CF6B] px-4 py-2 text-sm font-semibold text-[#0A0F1E] disabled:opacity-50"
            onClick={() => {
              setBusy(true);
              void (async () => {
                let sent = 0;
                let failed = 0;
                for (const item of items) {
                  if (!item.email) continue;
                  const res = await fetch(`/api/super/comptes-clients/${organizationId}/invite`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      firstName:
                        formatPersonName(item.firstName) ||
                        splitPersonName(item.name).firstName ||
                        "Participant",
                      lastName:
                        formatPersonName(item.lastName) ||
                        splitPersonName(item.name).lastName ||
                        "—",
                      email: item.email,
                      role: "learner",
                    }),
                  });
                  if (res.ok) sent += 1;
                  else failed += 1;
                }
                onDone(
                  failed
                    ? `${sent} invitation(s) envoyée(s), ${failed} échec(s).`
                    : `${sent} invitation(s) envoyée(s).`,
                );
              })().finally(() => setBusy(false));
            }}
          >
            Confirmer l&apos;envoi
          </button>
        </div>
      </div>
    </div>
  );
}
