"use client";

import { useMemo, useState } from "react";
import { cleanSiret, isValidSiret } from "@/lib/cfa/siret";
import { isOpcoContractReady } from "@/lib/cfa/company-opco";
import { dedupeTimelineItems } from "@/lib/cfa/company-events";
import type { IdentityCompany } from "./entreprise-section";
import type { CompanyContact } from "./contacts-section";
import type { CompanyApprentice, CompanyTutor } from "./tutors-section";

export type TimelineItem = {
  id: string;
  type: string;
  body: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  doneAt: string | null;
  createdAt: string;
  openedAt: string | null;
  actorName: string;
};

export type NextAction = { id: string; title: string | null; at: string | null };

const TYPE_LABELS: Record<string, string> = {
  note: "Note",
  call: "Appel",
  email: "E-mail",
  meeting: "Rendez-vous",
  status_change: "Étape",
  profile_sent: "Profil envoyé",
  placement: "Rattachement",
  opco_lookup: "Recherche OPCO",
};

const QUICK: Array<{ id: string; label: string; days: number | null }> = [
  { id: "1", label: "Demain", days: 1 },
  { id: "3", label: "Dans 3 j", days: 3 },
  { id: "7", label: "Dans 1 sem.", days: 7 },
  { id: "pick", label: "Date…", days: null },
];

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function atNine(base: Date) {
  const d = new Date(base);
  d.setHours(9, 0, 0, 0);
  const day = d.getDay();
  if (day === 6) d.setDate(d.getDate() + 2);
  if (day === 0) d.setDate(d.getDate() + 1);
  return d;
}

function defaultAt(days = 3) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return atNine(d);
}

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function reminderLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const jour = date.toLocaleDateString("fr-FR", { weekday: "short" }).replace(/\.$/, "");
  const day = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const hours = date.getHours();
  return `Rappel le ${jour}. ${day} à ${hours} h`;
}

export function contractChecklist({
  company,
  contacts,
  apprentices,
}: {
  company: IdentityCompany;
  contacts: CompanyContact[];
  apprentices: CompanyApprentice[];
}) {
  const address = (company.address_line || company.company_address || "").trim();
  const siretOk = isValidSiret(cleanSiret(company.siret));
  const addressOk = Boolean(address && company.postal_code?.trim() && company.city?.trim());
  const activityOk = Boolean(
    company.naf_code?.trim() && company.naf_label?.trim() && company.headcount_range?.trim(),
  );
  const mainOk = contacts.some((item) => (item.roles ?? []).includes("main"));
  const signatoryOk = contacts.some((item) => (item.roles ?? []).includes("signatory"));
  const withoutTutor = apprentices.filter((item) => !item.tutorId);
  const tutorOk = apprentices.length === 0 ? false : withoutTutor.length === 0;
  const idccOpcoOk = Boolean(company.idcc?.trim() && isOpcoContractReady(company));

  return [
    { id: "siret", label: "SIRET et adresse", done: siretOk && addressOk, href: "#entreprise", action: null as string | null },
    { id: "naf", label: "Activité et effectif", done: activityOk, href: "#entreprise", action: null },
    { id: "main", label: "Contact principal", done: mainOk, href: "#contacts", action: null },
    { id: "signatory", label: "Signataire du contrat", done: signatoryOk, href: "#contacts", action: "Désigner" },
    {
      id: "tutor",
      label: "Maître d'apprentissage",
      done: tutorOk,
      href: "#tuteurs",
      action: withoutTutor.length ? "Désigner" : null,
    },
    { id: "idcc", label: "IDCC et OPCO confirmés", done: idccOpcoOk, href: "#entreprise", action: "Compléter" },
  ] as const;
}

export function SuiviColumn({
  companyId,
  company,
  contacts,
  tutors,
  apprentices,
  timeline,
  nextAction,
  onChanged,
  onMessage,
  onScrollTo,
}: {
  companyId: string;
  company: IdentityCompany;
  contacts: CompanyContact[];
  tutors: CompanyTutor[];
  apprentices: CompanyApprentice[];
  timeline: TimelineItem[];
  nextAction: NextAction | null;
  onChanged: () => Promise<void> | void;
  onMessage: (message: string) => void;
  onScrollTo?: (id: string) => void;
}) {
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);
  const [postponing, setPostponing] = useState(false);
  const [title, setTitle] = useState("");
  const [quick, setQuick] = useState("3");
  const [at, setAt] = useState(() => toLocalInput(defaultAt(3)));
  const [busy, setBusy] = useState(false);
  const [historyMode, setHistoryMode] = useState<"all" | "notes">("all");
  const [historyOpen, setHistoryOpen] = useState(false);

  const lines = contractChecklist({ company, contacts, apprentices });
  const ready = lines.filter((line) => line.done).length;
  const complete = ready === 6;
  const late = nextAction?.at ? new Date(nextAction.at).getTime() < Date.now() : false;

  const visibleTimeline = useMemo(() => {
    const deduped = dedupeTimelineItems(
      timeline.filter((item) => item.id !== nextAction?.id && !item.nextActionAt),
    );
    const filtered = historyMode === "notes" ? deduped.filter((item) => item.type === "note") : deduped;
    return historyOpen ? filtered : filtered.slice(0, 5);
  }, [timeline, nextAction?.id, historyMode, historyOpen]);

  const totalHistory = useMemo(() => {
    const deduped = dedupeTimelineItems(
      timeline.filter((item) => item.id !== nextAction?.id && !item.nextActionAt),
    );
    return historyMode === "notes" ? deduped.filter((item) => item.type === "note").length : deduped.length;
  }, [timeline, nextAction?.id, historyMode]);

  async function send(body: Record<string, unknown>) {
    setBusy(true);
    onMessage("");
    try {
      const response = await fetch(`/api/super-admin/crm/cfa/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Enregistrement impossible");
      await onChanged();
      return true;
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Enregistrement impossible");
      return false;
    } finally {
      setBusy(false);
    }
  }

  function pickQuick(id: string) {
    setQuick(id);
    const item = QUICK.find((q) => q.id === id);
    if (!item || item.days == null) return;
    setAt(toLocalInput(defaultAt(item.days)));
  }

  void tutors;

  return (
    <div className="space-y-4">
      <section
        className="overflow-hidden rounded-[24px] border border-[#1A2340] bg-[#111831]"
        style={{
          background: complete
            ? "linear-gradient(180deg, #14322688 0%, #111831 48%)"
            : "linear-gradient(180deg, #3A2A0E55 0%, #111831 42%)",
          boxShadow: complete ? "inset 0 3px 0 #6BE39B" : "inset 0 3px 0 #F2CF6B",
        }}
      >
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-extrabold text-[#F2F4FA]">
              {complete ? "Prête pour le contrat ✓" : "À faire pour signer le contrat"}
            </h2>
            <span className={`text-sm font-extrabold ${complete ? "text-[#6BE39B]" : "text-[#F2CF6B]"}`}>
              {ready} / 6
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#1A2340]">
            <span
              className="block h-full rounded-full transition-all"
              style={{
                width: `${(ready / 6) * 100}%`,
                background: complete ? "#6BE39B" : "#F2CF6B",
              }}
            />
          </div>
          <ul className="mt-4 space-y-2">
            {lines.map((line) => (
              <li key={line.id} className="flex items-center gap-2.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                    line.done
                      ? "bg-[#6BE39B] text-[#04140C]"
                      : "border border-dashed border-[#5D6785] text-transparent"
                  }`}
                >
                  {line.done ? "✓" : ""}
                </span>
                <button
                  type="button"
                  className={`flex-1 text-left text-sm ${line.done ? "text-[#9AA3BD]" : "font-semibold text-[#F2F4FA]"}`}
                  onClick={() => onScrollTo?.(line.href.replace("#", ""))}
                >
                  {line.label}
                </button>
                {!line.done && line.action ? (
                  <button
                    type="button"
                    className="h-7 shrink-0 rounded-full bg-[#6E5BFF] px-2.5 text-[11px] font-extrabold text-white"
                    onClick={() => onScrollTo?.(line.href.replace("#", ""))}
                  >
                    {line.action}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
        <h2 className="text-[15px] font-extrabold text-[#F2F4FA]">Prochaine action</h2>
        {nextAction?.title && !asking ? (
          <div className="mt-3">
            <p className="text-sm font-extrabold text-[#F2F4FA]">{nextAction.title}</p>
            <p className={`mt-1 text-sm ${late ? "font-extrabold text-[#FF8A9B]" : "text-[#9AA3BD]"}`}>
              {nextAction.at ? reminderLabel(nextAction.at) : "Sans date"}
              {late ? " · en retard" : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className="h-9 rounded-full bg-[#6BE39B] px-3 text-xs font-extrabold text-[#04140C]"
                onClick={() => {
                  void send({ action: "complete_next_action", activityId: nextAction.id }).then((ok) => {
                    if (ok) {
                      setAsking(true);
                      setTitle("");
                      setQuick("3");
                      setAt(toLocalInput(defaultAt(3)));
                    }
                  });
                }}
              >
                Fait ✓
              </button>
              <button
                type="button"
                className="h-9 rounded-full border border-[#26304F] px-3 text-xs font-semibold text-[#B7BED3]"
                onClick={() => {
                  setPostponing((v) => !v);
                  setAt(toLocalInput(defaultAt(3)));
                }}
              >
                Reporter
              </button>
            </div>
            {postponing ? (
              <form
                className="mt-3 space-y-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void send({ action: "postpone_next_action", activityId: nextAction.id, at }).then((ok) => {
                    if (ok) setPostponing(false);
                  });
                }}
              >
                <input
                  required
                  aria-label="Nouvelle date"
                  type="datetime-local"
                  value={at}
                  onChange={(event) => setAt(event.target.value)}
                  className="h-10 w-full rounded-xl border border-[#26304F] bg-[#0B1122] px-2 text-sm"
                />
                <button type="submit" disabled={busy} className="h-9 rounded-full bg-[#6E5BFF] px-3 text-xs font-extrabold text-white">
                  OK
                </button>
              </form>
            ) : null}
          </div>
        ) : (
          <form
            className="mt-3 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send({ action: "set_next_action", title, at }).then((ok) => {
                if (ok) {
                  setAsking(false);
                  setTitle("");
                  setQuick("3");
                  setAt(toLocalInput(defaultAt(3)));
                }
              });
            }}
          >
            <input
              required
              aria-label="Prochaine action"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Relancer Claire Brunet pour le signataire"
              className="h-11 w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 text-sm outline-none placeholder:text-[#6C7593]"
            />
            <div className="flex flex-wrap gap-2">
              {QUICK.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => pickQuick(item.id)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: quick === item.id ? "#FFFFFF" : "#0B1122",
                    color: quick === item.id ? "#0A0F1E" : "#B7BED3",
                    border: quick === item.id ? "1px solid #FFFFFF" : "1px solid #26304F",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {quick === "pick" ? (
              <input
                required
                aria-label="Date personnalisée"
                type="datetime-local"
                value={at}
                onChange={(event) => setAt(event.target.value)}
                className="h-10 w-full rounded-xl border border-[#26304F] bg-[#0B1122] px-2 text-sm"
              />
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-[#9AA3BD]">{at ? reminderLabel(new Date(at).toISOString()) : ""}</p>
              <button type="submit" disabled={busy} className="h-9 rounded-full bg-[#6E5BFF] px-4 text-xs font-extrabold text-white">
                Planifier
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold text-[#F2F4FA]">Historique</h2>
          <div className="flex rounded-full border border-[#26304F] p-0.5 text-xs font-semibold">
            {(["all", "notes"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setHistoryMode(mode)}
                className="rounded-full px-2.5 py-1"
                style={{
                  background: historyMode === mode ? "#FFFFFF" : "transparent",
                  color: historyMode === mode ? "#0A0F1E" : "#9AA3BD",
                }}
              >
                {mode === "all" ? "Tout" : "Notes"}
              </button>
            ))}
          </div>
        </div>

        <textarea
          aria-label="Ajouter une note"
          value={note}
          rows={2}
          placeholder="Ajouter une note…"
          onChange={(event) => setNote(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              if (!note.trim()) return;
              void send({ action: "add_note", body: note.trim() }).then((ok) => {
                if (ok) setNote("");
              });
            }
          }}
          className="mt-3 w-full resize-none rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm outline-none placeholder:text-[#6C7593]"
        />

        <ul className="mt-4 space-y-3">
          {visibleTimeline.map((item) =>
            item.type === "note" ? (
              <li key={item.id} className="rounded-[14px] bg-[#0B1122] px-3 py-2.5">
                <p className="text-[13.5px] leading-snug text-[#F2F4FA]">{item.body}</p>
                <p className="mt-1.5 text-[11px] text-[#6C7593]">
                  Note · {item.actorName} · {when(item.createdAt)}
                </p>
              </li>
            ) : (
              <li key={item.id} className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#6E5BFF]" />
                <div>
                  <p className="text-[12.5px] leading-snug text-[#B7BED3]">{item.body || TYPE_LABELS[item.type] || item.type}</p>
                  <p className="mt-0.5 text-[11px] text-[#6C7593]">
                    {item.actorName === "Équipe CFA" ? "Automatique" : item.actorName} · {when(item.createdAt)}
                  </p>
                </div>
              </li>
            ),
          )}
        </ul>

        {totalHistory > 5 && !historyOpen ? (
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-[#A99BFF]"
            onClick={() => setHistoryOpen(true)}
          >
            Tout l&apos;historique ›
          </button>
        ) : null}
      </section>
    </div>
  );
}
