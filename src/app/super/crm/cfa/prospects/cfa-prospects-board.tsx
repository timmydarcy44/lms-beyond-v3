"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { CfaCreateProspectModal } from "@/components/control/cfa-create-prospect-modal";
import { FilterPill, PageTitle } from "@/components/control/cfa-board-chrome";
import { EmptyState } from "@/components/control/chrome";
import { formatPersonName } from "@/lib/cfa/format-org-name";
import { getCfaSpecializationFullLabel, type CfaApplication } from "@/lib/cfa-applications";
import { looksLikeTestAccount } from "@/lib/control/test-account";
import {
  CFA_CHANNEL_META,
  CFA_SOURCE_CHANNELS,
  channelMeta,
  originShortPrecision,
  prospectStatusLabel,
  relativeReceivedLabel,
  type CfaProspectStatus,
  type CfaSourceChannel,
} from "@/lib/cfa/person-origin";

type Touch = {
  id: string;
  person_id: string;
  type: string;
  detail: string | null;
  created_at: string;
};

const STATUS_FILTERS: Array<{ id: "all" | CfaProspectStatus; label: string }> = [
  { id: "all", label: "Tous" },
  { id: "new", label: "Nouveaux" },
  { id: "to_call", label: "À rappeler" },
  { id: "called", label: "Rappelés" },
  { id: "not_interested", label: "Pas intéressés" },
];

function isTest(item: CfaApplication) {
  return item.is_test === true || looksLikeTestAccount({ email: item.email, name: `${item.first_name} ${item.last_name}` });
}

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

function statusTone(status: string) {
  if (status === "to_call") return { bg: "#F2CF6B22", color: "#F2CF6B" };
  if (status === "called") return { bg: "#6BE39B22", color: "#6BE39B" };
  if (status === "not_interested") return { bg: "#6C759322", color: "#9AA3BD" };
  return { bg: "#6E5BFF22", color: "#B9AFFF" };
}

function touchLabel(type: string, detail: string | null) {
  if (type === "brochure_download") return "Plaquette téléchargée";
  if (type === "preregistration") return "Pré-inscription";
  if (type === "email_sent") return "E-mail envoyé";
  if (type === "email_opened") return "E-mail ouvert";
  if (type === "call") return "Appel";
  if (type === "meeting") return "Rencontre";
  if (type === "stage_change") return "Passage en candidature";
  if (type === "follow_up") return detail || "Rappel conseillé sous 48 h";
  return detail || "Création";
}

export function CfaProspectsBoard() {
  const [prospects, setProspects] = useState<CfaApplication[]>([]);
  const [monthPeople, setMonthPeople] = useState<CfaApplication[]>([]);
  const [touches, setTouches] = useState<Touch[]>([]);
  const [actorLabel, setActorLabel] = useState("l’équipe");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CfaProspectStatus>("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [formationFilter, setFormationFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [showTests, setShowTests] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa/prospects", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Chargement impossible");
      setProspects(json.prospects ?? []);
      setMonthPeople(json.monthPeople ?? []);
      setTouches(json.touches ?? []);
      if (json.actor?.label) setActorLabel(json.actor.label);
      setSelectedId((current) => current ?? json.prospects?.[0]?.id ?? null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) setSelectedId(id);
  }, []);

  const pool = useMemo(
    () => (showTests ? prospects : prospects.filter((item) => !isTest(item))),
    [prospects, showTests],
  );

  const statusCounts = useMemo(() => {
    const counts = { all: pool.length, new: 0, to_call: 0, called: 0, not_interested: 0 };
    for (const item of pool) {
      const status = (item.prospect_status || "new") as CfaProspectStatus;
      counts[status] += 1;
    }
    return counts;
  }, [pool]);

  const filtered = useMemo(() => {
    return pool.filter((item) => {
      const status = (item.prospect_status || "new") as CfaProspectStatus;
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (originFilter !== "all" && item.source_channel !== originFilter) return false;
      if (formationFilter !== "all" && item.specialization !== formationFilter) return false;
      return true;
    });
  }, [pool, statusFilter, originFilter, formationFilter]);

  const selected = filtered.find((item) => item.id === selectedId) ?? filtered[0] ?? null;

  const monthBanner = useMemo(() => {
    const from = monthStart();
    const people = (showTests ? monthPeople : monthPeople.filter((item) => !isTest(item))).filter(
      (item) => new Date(item.created_at).getTime() >= from,
    );
    return CFA_SOURCE_CHANNELS.map((channel) => {
      const rows = people.filter((item) => (item.first_touch || item.source_channel) === channel);
      const passed = rows.filter((item) => item.status !== "prospect").length;
      return { channel, count: rows.length, passed };
    }).filter((row) => row.count > 0);
  }, [monthPeople, showTests]);

  const selectedTouches = useMemo(
    () => touches.filter((item) => item.person_id === selected?.id).slice(0, 12),
    [touches, selected],
  );

  async function patch(action: string, extra: Record<string, unknown> = {}) {
    if (!selected) return;
    await fetch("/api/super-admin/crm/cfa/prospects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, action, ...extra }),
    });
    await load();
  }

  const formations = useMemo(
    () => [...new Set(pool.map((item) => item.specialization))].filter(Boolean),
    [pool],
  );

  return (
    <div className="mx-auto max-w-[1240px] space-y-5 px-6 py-8 text-[#F2F4FA]">
      <PageTitle
        title="Futurs candidats"
        subtitle={`${pool.length} jeunes intéressés par Byound School · pas encore candidats`}
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="h-10 rounded-full bg-[#6E5BFF] px-4 text-sm font-extrabold text-white"
          >
            + Saisir un contact
          </button>
        }
      />

      <CfaCreateProspectModal
        open={createOpen}
        defaultPlacement="prospect"
        actorLabel={actorLabel}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          void load();
        }}
      />

      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}

      <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[17px] font-extrabold">Ce mois-ci</h2>
          <p className="text-sm text-[#9AA3BD]">par canal de premier contact</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(monthBanner.length ? monthBanner : CFA_SOURCE_CHANNELS.slice(0, 5).map((channel) => ({ channel, count: 0, passed: 0 }))).map(
            (row) => {
              const meta = CFA_CHANNEL_META[row.channel];
              return (
                <div key={row.channel} className="rounded-2xl border border-[#1A2340] bg-[#0B1122] p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#6C7593]">
                    {meta.familyLabel}
                  </p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: meta.color }}>
                    {meta.label}
                  </p>
                  <p className="mt-2 text-[22px] font-extrabold">{row.count}</p>
                  <p className="text-xs text-[#6C7593]">
                    {row.passed} passé{row.passed > 1 ? "s" : ""} candidat{row.passed > 1 ? "s" : ""}
                  </p>
                </div>
              );
            },
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((item) => (
          <FilterPill
            key={item.id}
            active={statusFilter === item.id}
            count={statusCounts[item.id]}
            onClick={() => setStatusFilter(item.id)}
          >
            {item.label}
          </FilterPill>
        ))}
        <select
          value={originFilter}
          onChange={(e) => setOriginFilter(e.target.value)}
          className="ml-auto rounded-full border border-[#26304F] bg-[#111831] px-3 py-1.5 text-sm text-[#B7BED3]"
        >
          <option value="all">Origine : tous</option>
          {CFA_SOURCE_CHANNELS.map((channel) => (
            <option key={channel} value={channel}>
              {CFA_CHANNEL_META[channel].label}
            </option>
          ))}
        </select>
        <select
          value={formationFilter}
          onChange={(e) => setFormationFilter(e.target.value)}
          className="rounded-full border border-[#26304F] bg-[#111831] px-3 py-1.5 text-sm text-[#B7BED3]"
        >
          <option value="all">Formation : toutes</option>
          {formations.map((value) => (
            <option key={value} value={value}>
              {getCfaSpecializationFullLabel(value)}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-xs text-[#6C7593]">
          <input type="checkbox" checked={showTests} onChange={(e) => setShowTests(e.target.checked)} />
          Tests
        </label>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-[24px] bg-[#111831]" />
      ) : filtered.length === 0 ? (
        <EmptyState title="Aucun futur candidat pour ce filtre" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-hidden rounded-[24px] border border-[#1A2340] bg-[#111831]">
            <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)_110px_120px] gap-3 px-[22px] py-3 text-[12.5px] font-extrabold text-[#6C7593]">
              <span>Contact</span>
              <span>Origine</span>
              <span>Reçu</span>
              <span>Statut</span>
            </div>
            {filtered.map((item) => {
              const name = formatPersonName(`${item.first_name} ${item.last_name}`);
              const origin = originShortPrecision({
                sourceChannel: item.source_channel,
                sourceDetail: item.source_detail,
                prescriberType: item.prescriber_type,
                utmSource: item.utm_source,
                createdByInitials: item.created_by_initials,
                firstTouch: item.first_touch,
              });
              const status = item.prospect_status || "new";
              const tone = statusTone(status);
              const active = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className="grid w-full grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)_110px_120px] items-center gap-3 border-t border-[#1A2340] px-[22px] py-3.5 text-left"
                  style={{ background: active ? "#6E5BFF14" : undefined }}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#1A2340] text-xs font-extrabold">
                      {name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-extrabold">{name}</span>
                      <span className="block truncate text-xs text-[#9AA3BD]">
                        {getCfaSpecializationFullLabel(item.specialization)}
                      </span>
                    </span>
                  </span>
                  <span>
                    <span
                      className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ background: `${origin.color}22`, color: origin.color }}
                    >
                      {origin.pill}
                    </span>
                    {origin.detail ? <span className="mt-1 block truncate text-xs text-[#9AA3BD]">{origin.detail}</span> : null}
                  </span>
                  <span className="text-sm text-[#9AA3BD]">{relativeReceivedLabel(item.created_at)}</span>
                  <span className="rounded-full px-2.5 py-1 text-center text-[11px] font-semibold" style={{ background: tone.bg, color: tone.color }}>
                    {prospectStatusLabel(status)}
                  </span>
                </button>
              );
            })}
          </div>

          {selected ? (
            <aside className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#6E5BFF] text-sm font-extrabold">
                    {`${selected.first_name[0] ?? ""}${selected.last_name[0] ?? ""}`.toUpperCase()}
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold">{formatPersonName(`${selected.first_name} ${selected.last_name}`)}</h3>
                    <p className="text-sm text-[#9AA3BD]">{getCfaSpecializationFullLabel(selected.specialization)}</p>
                  </div>
                </div>
                <span className="rounded-full bg-[#6E5BFF22] px-2.5 py-1 text-[11px] font-semibold text-[#B9AFFF]">
                  {prospectStatusLabel(selected.prospect_status)}
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-[#0B1122] p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#6C7593]">Premier contact</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: channelMeta(selected.first_touch || selected.source_channel).color }}>
                    {channelMeta(selected.first_touch || selected.source_channel).label}
                    {selected.source_detail ? ` · ${selected.source_detail}` : ""}
                  </p>
                </div>
                <div className="rounded-2xl bg-[#0B1122] p-3">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#6C7593]">Campagne</p>
                  <p className="mt-1 text-sm">
                    {selected.utm_source || selected.utm_campaign
                      ? [selected.utm_source, selected.utm_medium, selected.utm_campaign].filter(Boolean).join(" · ")
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-extrabold">Historique</p>
                <ul className="mt-2 space-y-2 text-sm text-[#C9D2E8]">
                  {selectedTouches.length === 0 ? <li className="text-[#6C7593]">Aucun événement.</li> : null}
                  {selectedTouches.map((touch) => (
                    <li key={touch.id} className="flex gap-2">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#6E5BFF]" />
                      <span>
                        {touchLabel(touch.type, touch.detail)}
                        <span className="block text-xs text-[#6C7593]">{relativeReceivedLabel(touch.created_at)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {selected.contact_consent ? (
                <p className="mt-4 text-xs text-[#6BE39B]">
                  Accepte d&apos;être recontacté·e
                  {selected.contact_consent_at
                    ? ` · ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(selected.contact_consent_at))}`
                    : ""}
                </p>
              ) : (
                <p className="mt-4 text-xs text-[#F2CF6B]">Consentement de recontact non horodaté</p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {selected.phone ? (
                  <a
                    href={`tel:${selected.phone}`}
                    onClick={() => void patch("set_status", { prospectStatus: "called" })}
                    className="rounded-full border border-[#26304F] px-3 py-2 text-sm font-semibold"
                  >
                    Appeler
                  </a>
                ) : (
                  <button type="button" onClick={() => void patch("set_status", { prospectStatus: "to_call" })} className="rounded-full border border-[#26304F] px-3 py-2 text-sm font-semibold">
                    À rappeler
                  </button>
                )}
                <a href={`mailto:${selected.email}`} className="rounded-full border border-[#26304F] px-3 py-2 text-sm font-semibold">
                  Écrire
                </a>
                <button
                  type="button"
                  onClick={() => void patch("promote")}
                  className="rounded-full bg-white px-3 py-2 text-sm font-extrabold text-[#0A0F1E]"
                >
                  Passer en candidature →
                </button>
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </div>
  );
}
