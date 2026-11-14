"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  Check,
  Eye,
  FileText,
  MoreHorizontal,
  Plus,
  Upload,
} from "lucide-react";
import {
  ACTION_STATUS_LABEL,
  PIPELINE_STEPS,
  accommodationCategoryLabel,
  type DisabilityCaseDetail,
} from "@/lib/handicap/case-types";
import { HANDICAP_THEME as T } from "@/lib/handicap/theme";

const OWNER_LABEL: Record<string, string> = {
  referent: "Référente",
  trainer: "Formateur",
  byound: "Byound",
  company: "Entreprise",
  partner: "Partenaire",
};

const PARTNER_LABEL: Record<string, string> = {
  agefiph: "Agefiph",
  cap_emploi: "Cap emploi",
  medecin_travail: "Médecin du travail",
  autre: "Autre",
};

const MODE_LABEL: Record<string, string> = {
  visio: "Visio",
  telephone: "Téléphone",
  presentiel: "Présentiel",
};

const ACCESS_LABEL: Record<string, string> = {
  view_case: "Ouverture du dossier",
  open_document: "Ouverture d'un document",
  share_trainer: "Partage formateur",
  export: "Export",
  manual_delete: "Suppression manuelle",
};

const CAT_COLOR: Record<string, string> = {
  evaluations: T.blue,
  supports: T.violet,
  rythme: T.amber,
  locaux: T.green,
  materiel: T.accent,
  autre: T.muted,
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMonthYear(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })} · ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `il y a ${d} j`;
  return formatDate(iso);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function rqthTone(until: string | null): "ok" | "amber" | "red" | "none" {
  if (!until) return "none";
  const d = new Date(until);
  const now = new Date();
  if (d < now) return "red";
  const in45 = new Date(now);
  in45.setDate(in45.getDate() + 45);
  if (d <= in45) return "amber";
  return "ok";
}

type Bundle = { case: DisabilityCaseDetail; isSuperAdmin: boolean };

export function HandicapCaseDossier({
  initial,
}: {
  initial: Bundle;
}) {
  const [bundle, setBundle] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAccForm, setShowAccForm] = useState(false);
  const [showActionForm, setShowActionForm] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [viewNotesId, setViewNotesId] = useState<string | null>(null);
  const [showAllLog, setShowAllLog] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const c = bundle.case;

  useEffect(() => {
    setBundle(initial);
  }, [initial]);

  async function mutate(body: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/handicap/cases/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as Bundle & { error?: string };
    if (!res.ok) {
      setError(json?.error || "Échec");
      return false;
    }
    if (json?.case) setBundle({ case: json.case, isSuperAdmin: Boolean(json.isSuperAdmin) });
    return true;
  }

  function run(body: Record<string, unknown>) {
    startTransition(() => {
      void mutate(body);
    });
  }

  function onNotesChange(meetingId: string, notes: string) {
    setBundle((prev) => ({
      ...prev,
      case: {
        ...prev.case,
        meetings: prev.case.meetings.map((m) =>
          m.id === meetingId ? { ...m, notes } : m,
        ),
      },
    }));
    setNotesSaved(false);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      void mutate({ action: "save_meeting_notes", meeting_id: meetingId, notes }).then((ok) => {
        if (ok) setNotesSaved(true);
      });
    }, 800);
  }

  const openMeeting =
    c.meetings.find((m) => m.status === "open") ?? null;
  const closedMeetings = c.meetings.filter((m) => m.status === "closed");
  const rqth = rqthTone(c.rqthValidUntil);
  const logLines = showAllLog ? c.accessLog : c.accessLog.slice(0, 5);

  return (
    <div className="space-y-5">
      {error ? (
        <p className="rounded-2xl px-4 py-2 text-sm" style={{ background: "rgba(255,138,155,0.12)", color: T.red }}>
          {error}
        </p>
      ) : null}

      {/* Header */}
      <header
        className="relative overflow-hidden rounded-[30px] border p-6"
        style={{
          borderColor: T.border,
          background:
            "radial-gradient(120% 140% at 0% 0%, #14504A 0%, #12253A 45%, #111831 100%)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-lg font-extrabold"
              style={{ background: "rgba(94,220,195,0.2)", color: T.accent }}
            >
              {initials(c.personName)}
            </div>
            <div className="min-w-0">
              <h1 className="text-[32px] font-extrabold leading-tight tracking-tight">
                {c.personName}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className="rounded-full px-3 py-1 text-[12px] font-bold"
                  style={{ background: "rgba(94,220,195,0.15)", color: T.accent }}
                >
                  {c.statusLabel}
                </span>
                {c.rqthValidUntil ? (
                  <span
                    className="rounded-full px-3 py-1 text-[12px] font-bold"
                    style={{
                      background:
                        rqth === "red"
                          ? "rgba(255,138,155,0.15)"
                          : rqth === "amber"
                            ? "rgba(242,207,107,0.15)"
                            : "rgba(255,255,255,0.08)",
                      color:
                        rqth === "red" ? T.red : rqth === "amber" ? T.amber : T.muted,
                    }}
                  >
                    RQTH valide jusqu&apos;en {formatMonthYear(c.rqthValidUntil)}
                  </span>
                ) : null}
                {c.consentGivenAt ? (
                  <span
                    className="rounded-full px-3 py-1 text-[12px] font-bold"
                    style={{ background: "rgba(107,227,155,0.15)", color: T.green }}
                  >
                    ✓ Consentement recueilli le {formatDate(c.consentGivenAt)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-[12px] font-bold"
                      style={{ background: "rgba(255,138,155,0.15)", color: T.red }}
                    >
                      Consentement à recueillir
                    </span>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        if (confirm("Confirmer le recueil du consentement ?")) {
                          run({ action: "set_consent", consent_method: "oral" });
                        }
                      }}
                      className="rounded-full px-3 py-1 text-[12px] font-bold"
                      style={{ background: T.accent, color: T.bg }}
                    >
                      Recueillir
                    </button>
                  </span>
                )}
              </div>
              <p className="mt-3 text-[13px]" style={{ color: T.muted }}>
                {c.statusLabel}
                {c.organizationName ? ` · ${c.organizationName}` : ""}
                {" · Prochaine formation : "}
                {c.nextFormation || "—"}
              </p>
            </div>
          </div>

          <div className="relative flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-full border px-4 py-2 text-[13px] font-bold"
              style={{ borderColor: T.borderSoft, color: T.text }}
              onClick={() => alert("Messagerie — Lot 4")}
            >
              ✉ Message
            </button>
            <button
              type="button"
              className="rounded-full px-4 py-2 text-[13px] font-bold"
              style={{ background: "#fff", color: T.bg }}
              onClick={() => setShowMeetingForm(true)}
            >
              Planifier un rendez-vous
            </button>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border"
              style={{ borderColor: T.borderSoft }}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Plus d'actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen ? (
              <div
                className="absolute right-0 top-12 z-20 w-56 rounded-2xl border py-2 shadow-xl"
                style={{ background: T.card, borderColor: T.border }}
              >
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-[13px] hover:bg-white/5"
                  onClick={() => {
                    setMenuOpen(false);
                    if (confirm("Clore ce dossier ?")) {
                      run({ action: "set_status", status: "closed" });
                    }
                  }}
                >
                  Clore le dossier
                </button>
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-[13px] hover:bg-white/5"
                  onClick={() => {
                    setMenuOpen(false);
                    run({ action: "export_log" });
                    alert("Export PDF — Lot 4");
                  }}
                >
                  Exporter le dossier PDF
                </button>
                {bundle.isSuperAdmin ? (
                  <Link
                    href="/super/crm/qualiopi/handicap"
                    className="block px-4 py-2 text-[13px] hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    Voir dans Byound Control
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Pipeline */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {PIPELINE_STEPS.map((step, idx) => {
            const done = idx < c.stepIndex || (c.status === "closed" && idx <= c.stepIndex);
            const current = idx === c.stepIndex && c.status !== "closed";
            return (
              <button
                key={step.id}
                type="button"
                disabled={pending}
                onClick={() => {
                  if (
                    confirm(
                      `Passer à l'étape « ${step.label} » ?`,
                    )
                  ) {
                    run({ action: "set_status", status: step.id });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-bold transition"
                style={{
                  borderColor: current ? T.accent : done ? T.green : T.borderSoft,
                  background: current
                    ? "rgba(94,220,195,0.18)"
                    : done
                      ? "rgba(107,227,155,0.12)"
                      : "transparent",
                  color: current ? T.accent : done ? T.green : T.muted,
                  boxShadow: current ? `0 0 0 3px rgba(94,220,195,0.25)` : undefined,
                }}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : null}
                {step.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Accommodations */}
          <section
            className="rounded-[24px] border p-5"
            style={{ background: T.card, borderColor: T.border }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-extrabold">Besoins et aménagements</h2>
                <p className="mt-0.5 text-[12px]" style={{ color: T.muted }}>
                  On décrit les besoins, jamais le handicap
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAccForm((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold"
                style={{ background: "rgba(255,255,255,0.06)", color: T.text }}
              >
                <Plus className="h-3.5 w-3.5" /> Aménagement
              </button>
            </div>

            {showAccForm ? (
              <AccommodationForm
                pending={pending}
                onCancel={() => setShowAccForm(false)}
                onSubmit={(payload) => {
                  startTransition(async () => {
                    const ok = await mutate({ action: "add_accommodation", ...payload });
                    if (ok) setShowAccForm(false);
                  });
                }}
              />
            ) : null}

            {c.accommodations.length === 0 ? (
              <p className="mt-4 text-sm" style={{ color: T.muted }}>
                Aucun aménagement pour le moment.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {c.accommodations.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl border p-3.5"
                    style={{ background: T.inner, borderColor: T.borderSoft }}
                  >
                    <p
                      className="text-[11px] font-bold"
                      style={{ color: CAT_COLOR[a.category] ?? T.muted }}
                    >
                      {accommodationCategoryLabel(a.category)}
                    </p>
                    <p className="mt-1 text-[14.5px] font-extrabold leading-snug">{a.label}</p>
                    {a.details ? (
                      <p className="mt-1 text-[12px] leading-relaxed" style={{ color: T.muted }}>
                        {a.details}
                      </p>
                    ) : null}
                    <div className="mt-3">
                      {a.sharedWithTrainerAt ? (
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{ background: "rgba(107,227,155,0.15)", color: T.green }}
                        >
                          ✓ Transmis au formateur
                        </span>
                      ) : (
                        <span
                          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{ background: "rgba(242,207,107,0.15)", color: T.amber }}
                        >
                          À transmettre
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {c.accommodations.some((a) => !a.sharedWithTrainerAt) ? (
              <button
                type="button"
                disabled={pending}
                className="mt-4 rounded-full px-4 py-2 text-[13px] font-bold"
                style={{ background: T.accent, color: T.bg }}
                onClick={() => {
                  const email = window.prompt(
                    "E-mail du formateur (optionnel — sans e-mail, le partage est seulement journalisé) :",
                    "",
                  );
                  if (
                    confirm(
                      "Transmettre uniquement la liste des aménagements au formateur (sans motif, RQTH ni documents) ?",
                    )
                  ) {
                    run({
                      action: "share_accommodations",
                      confirmed: true,
                      trainer_email: email || "",
                    });
                  }
                }}
              >
                Transmettre au formateur
              </button>
            ) : null}
          </section>

          {/* Actions plan */}
          <section
            className="rounded-[24px] border p-5"
            style={{ background: T.card, borderColor: T.border }}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[16px] font-extrabold">Plan d&apos;accompagnement</h2>
              <button
                type="button"
                onClick={() => setShowActionForm((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <Plus className="h-3.5 w-3.5" /> Action
              </button>
            </div>

            {showActionForm ? (
              <ActionForm
                pending={pending}
                onCancel={() => setShowActionForm(false)}
                onSubmit={(payload) => {
                  startTransition(async () => {
                    const ok = await mutate({ action: "add_action", ...payload });
                    if (ok) setShowActionForm(false);
                  });
                }}
              />
            ) : null}

            <ul className="mt-4 space-y-2">
              {c.actions.length === 0 ? (
                <li className="text-sm" style={{ color: T.muted }}>
                  Aucune action planifiée.
                </li>
              ) : (
                c.actions.map((a) => {
                  const overdue =
                    a.status !== "done" &&
                    a.dueDate &&
                    new Date(a.dueDate) < new Date(new Date().toDateString());
                  return (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 rounded-2xl border px-3 py-2.5"
                      style={{ background: T.inner, borderColor: T.borderSoft }}
                    >
                      <input
                        type="checkbox"
                        checked={a.status === "done"}
                        disabled={pending}
                        onChange={() => run({ action: "toggle_action", action_id: a.id })}
                        className="h-4 w-4 accent-[#5EDCC3]"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[14px] font-bold"
                          style={{
                            textDecoration: a.status === "done" ? "line-through" : undefined,
                            color: overdue ? T.red : T.text,
                          }}
                        >
                          {a.label}
                        </p>
                        <p className="text-[12px]" style={{ color: overdue ? T.red : T.muted }}>
                          {OWNER_LABEL[a.owner] ?? a.owner}
                          {a.dueDate ? ` · ${formatDate(a.dueDate)}` : ""}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{
                          background:
                            a.status === "done"
                              ? "rgba(107,227,155,0.15)"
                              : overdue
                                ? "rgba(255,138,155,0.15)"
                                : "rgba(255,255,255,0.06)",
                          color:
                            a.status === "done" ? T.green : overdue ? T.red : T.muted,
                        }}
                      >
                        {a.status === "done"
                          ? "Fait"
                          : overdue
                            ? "En retard"
                            : ACTION_STATUS_LABEL[a.status] || a.status}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          {/* Meetings */}
          <section
            className="rounded-[24px] border p-5"
            style={{ background: T.card, borderColor: T.border }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-extrabold">Rendez-vous</h2>
                <p className="mt-0.5 text-[12px]" style={{ color: T.muted }}>
                  Notes confidentielles, visibles par vous seule
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMeetingForm((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <Plus className="h-3.5 w-3.5" /> RDV
              </button>
            </div>

            {showMeetingForm ? (
              <MeetingForm
                pending={pending}
                onCancel={() => setShowMeetingForm(false)}
                onSubmit={(payload) => {
                  startTransition(async () => {
                    const ok = await mutate({ action: "add_meeting", ...payload });
                    if (ok) setShowMeetingForm(false);
                  });
                }}
              />
            ) : null}

            {openMeeting ? (
              <div
                className="mt-4 rounded-2xl border p-4"
                style={{ borderColor: T.accent, background: T.inner }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[15px] font-extrabold">{openMeeting.title}</p>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={{ background: "rgba(94,220,195,0.15)", color: T.accent }}
                  >
                    {formatDateTime(openMeeting.scheduledAt)}
                    {openMeeting.mode
                      ? ` · ${MODE_LABEL[openMeeting.mode] ?? openMeeting.mode}`
                      : ""}
                  </span>
                </div>
                <textarea
                  value={openMeeting.notes}
                  onChange={(e) => onNotesChange(openMeeting.id, e.target.value)}
                  rows={5}
                  placeholder="Notes de l'entretien…"
                  className="mt-3 w-full resize-y rounded-xl border bg-transparent px-3 py-2 text-[13px] outline-none"
                  style={{ borderColor: T.borderSoft, color: T.text }}
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px]" style={{ color: T.tertiary }}>
                    {notesSaved ? "Enregistré automatiquement" : "Saisie…"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      className="rounded-full border px-3 py-1.5 text-[12px] font-bold"
                      style={{ borderColor: T.borderSoft }}
                      onClick={() => {
                        const next = window.prompt(
                          "Nouvelle date/heure (AAAA-MM-JJTHH:MM)",
                          openMeeting.scheduledAt?.slice(0, 16) || "",
                        );
                        if (next) {
                          run({
                            action: "reschedule_meeting",
                            meeting_id: openMeeting.id,
                            scheduled_at: new Date(next).toISOString(),
                          });
                        }
                      }}
                    >
                      Reporter
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      className="rounded-full px-3 py-1.5 text-[12px] font-bold"
                      style={{ background: T.accent, color: T.bg }}
                      onClick={() => {
                        if (confirm("Clôturer ce rendez-vous ? Les notes resteront lisibles mais non modifiables.")) {
                          run({ action: "close_meeting", meeting_id: openMeeting.id });
                        }
                      }}
                    >
                      Clôturer le rendez-vous
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm" style={{ color: T.muted }}>
                Aucun rendez-vous ouvert.
              </p>
            )}

            {closedMeetings.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {closedMeetings.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[13px]"
                    style={{ borderColor: T.borderSoft }}
                  >
                    <span style={{ color: T.muted }}>
                      ✓ {m.title} · {formatDateTime(m.scheduledAt)}
                      {m.mode ? ` · ${MODE_LABEL[m.mode] ?? m.mode}` : ""}
                    </span>
                    <button
                      type="button"
                      className="text-[12px] font-bold"
                      style={{ color: T.accent }}
                      onClick={() => setViewNotesId(viewNotesId === m.id ? null : m.id)}
                    >
                      Voir les notes
                    </button>
                    {viewNotesId === m.id ? (
                      <p
                        className="w-full whitespace-pre-wrap rounded-xl border p-3 text-[12px]"
                        style={{ borderColor: T.borderSoft, background: T.inner, color: T.muted }}
                      >
                        {m.notes || "Aucune note."}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <section
            className="rounded-[24px] border p-5"
            style={{ background: T.card, borderColor: T.border }}
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[16px] font-extrabold">Documents</h2>
              <button
                type="button"
                onClick={() => setShowUpload((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <Upload className="h-3.5 w-3.5" /> Déposer
              </button>
            </div>

            {showUpload ? (
              <UploadForm
                caseId={c.id}
                pending={pending}
                onCancel={() => setShowUpload(false)}
                onDone={(next) => {
                  setBundle(next);
                  setShowUpload(false);
                }}
                onError={setError}
                setPending={startTransition}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowUpload(true)}
                className="mt-3 flex w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed px-4 py-6 text-[12px]"
                style={{ borderColor: T.borderSoft, color: T.muted }}
              >
                <Upload className="h-5 w-5" style={{ color: T.accent }} />
                PDF, JPG ou PNG · 10 Mo max
              </button>
            )}

            <ul className="mt-4 space-y-2">
              {c.documents.length === 0 ? (
                <li className="text-sm" style={{ color: T.muted }}>
                  Aucun document.
                </li>
              ) : (
                c.documents.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-3 rounded-2xl border px-3 py-2.5"
                    style={{ background: T.inner, borderColor: T.borderSoft }}
                  >
                    <FileText className="h-5 w-5 shrink-0" style={{ color: T.accent }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">{d.title}</p>
                      <p className="text-[11px]" style={{ color: T.muted }}>
                        Déposé le {formatDate(d.uploadedAt)}
                        {d.validUntil ? ` · valide jusqu'en ${formatMonthYear(d.validUntil)}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="grid h-8 w-8 place-items-center rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                      aria-label="Ouvrir"
                      onClick={() => {
                        void (async () => {
                          const res = await fetch(
                            `/api/handicap/cases/${c.id}/documents/${d.id}`,
                          );
                          const json = (await res.json().catch(() => null)) as {
                            signedUrl?: string;
                            error?: string;
                          };
                          if (!res.ok || !json?.signedUrl) {
                            setError(json?.error || "Impossible d'ouvrir");
                            return;
                          }
                          window.open(json.signedUrl, "_blank", "noopener,noreferrer");
                        })();
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section
            className="rounded-[24px] border p-5"
            style={{ background: T.card, borderColor: T.border }}
          >
            <h2 className="text-[16px] font-extrabold">Qui est informé</h2>
            <p className="mt-0.5 text-[12px]" style={{ color: T.muted }}>
              Décidé avec {c.personFirstName}, modifiable à tout moment
            </p>

            <div
              className="mt-4 rounded-2xl border px-3 py-3 text-[13px]"
              style={{ background: T.inner, borderColor: T.borderSoft }}
            >
              <p className="font-bold">Formateur de la session</p>
              <p className="mt-0.5" style={{ color: T.muted }}>
                Reçoit les aménagements, sans le motif
              </p>
            </div>

            <div
              className="mt-3 flex items-center justify-between gap-3 rounded-2xl border px-3 py-3"
              style={{ background: T.inner, borderColor: T.borderSoft }}
            >
              <div>
                <p className="text-[13px] font-bold">Entreprise</p>
                <p className="text-[12px]" style={{ color: T.muted }}>
                  {c.companyInformed
                    ? "Informée (avec accord)"
                    : `Non informée : choix de ${c.personFirstName}`}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                role="switch"
                aria-checked={c.companyInformed}
                onClick={() => {
                  if (!c.companyInformed) {
                    if (
                      !confirm(
                        `${c.personFirstName} a bien donné son accord pour informer l'entreprise ?`,
                      )
                    ) {
                      return;
                    }
                    run({ action: "set_company_informed", company_informed: true, confirmed: true });
                  } else {
                    run({ action: "set_company_informed", company_informed: false });
                  }
                }}
                className="relative h-7 w-12 shrink-0 rounded-full transition"
                style={{
                  background: c.companyInformed ? T.accent : T.borderSoft,
                }}
              >
                <span
                  className="absolute top-0.5 h-6 w-6 rounded-full bg-white transition"
                  style={{ left: c.companyInformed ? 22 : 2 }}
                />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {c.partners.length === 0 ? (
                <p className="text-[12px]" style={{ color: T.muted }}>
                  Aucun partenaire mobilisé.
                </p>
              ) : (
                c.partners.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border px-3 py-2.5 text-[13px]"
                    style={{ background: T.inner, borderColor: T.borderSoft }}
                  >
                    <p className="font-bold">{PARTNER_LABEL[p.partner] ?? p.partner}</p>
                    {p.status ? (
                      <p className="text-[12px]" style={{ color: T.muted }}>
                        {p.status}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
              <PartnerQuickAdd
                pending={pending}
                onAdd={(partner) => run({ action: "add_partner", partner })}
              />
            </div>
          </section>

          <section
            className="rounded-[24px] border p-5"
            style={{ background: T.card, borderColor: T.border }}
          >
            <h2 className="text-[16px] font-extrabold">Journal d&apos;accès</h2>
            <ul className="mt-3 space-y-2">
              {logLines.length === 0 ? (
                <li className="text-sm" style={{ color: T.muted }}>
                  Aucune entrée.
                </li>
              ) : (
                logLines.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-start justify-between gap-2 text-[12px]"
                    style={{ color: T.muted }}
                  >
                    <span>
                      {ACCESS_LABEL[l.action] ?? l.action}
                      {l.actorId ? (
                        <span className="ml-1 opacity-60">
                          · {l.actorId.slice(0, 8)}…
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0">{relativeTime(l.createdAt)}</span>
                  </li>
                ))
              )}
            </ul>
            {c.accessLog.length > 5 ? (
              <button
                type="button"
                className="mt-3 text-[12px] font-bold"
                style={{ color: T.accent }}
                onClick={() => setShowAllLog((v) => !v)}
              >
                {showAllLog ? "Réduire" : "Tout le journal"}
              </button>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function AccommodationForm({
  pending,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  onCancel: () => void;
  onSubmit: (p: { category: string; label: string; details: string }) => void;
}) {
  const [category, setCategory] = useState("autre");
  const [label, setLabel] = useState("");
  const [details, setDetails] = useState("");
  return (
    <form
      className="mt-4 space-y-3 rounded-2xl border p-4"
      style={{ borderColor: T.borderSoft, background: T.inner }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!label.trim()) return;
        onSubmit({ category, label: label.trim(), details: details.trim() });
      }}
    >
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-[13px]"
        style={{ borderColor: T.borderSoft }}
      >
        {["evaluations", "supports", "rythme", "locaux", "materiel", "autre"].map((k) => (
          <option key={k} value={k}>
            {accommodationCategoryLabel(k)}
          </option>
        ))}
      </select>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Libellé de l'aménagement"
        required
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-[13px]"
        style={{ borderColor: T.borderSoft }}
      />
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={2}
        placeholder="Détails"
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-[13px]"
        style={{ borderColor: T.borderSoft }}
      />
      <p className="text-[11px]" style={{ color: T.tertiary }}>
        Décrivez le besoin, pas la situation médicale.
      </p>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full px-4 py-2 text-[12px] font-bold"
          style={{ background: T.accent, color: T.bg }}
        >
          Ajouter
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-4 py-2 text-[12px] font-bold"
          style={{ color: T.muted }}
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

function ActionForm({
  pending,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  onCancel: () => void;
  onSubmit: (p: { label: string; owner: string; due_date: string }) => void;
}) {
  const [label, setLabel] = useState("");
  const [owner, setOwner] = useState("referent");
  const [due, setDue] = useState("");
  return (
    <form
      className="mt-4 space-y-3 rounded-2xl border p-4"
      style={{ borderColor: T.borderSoft, background: T.inner }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!label.trim()) return;
        onSubmit({ label: label.trim(), owner, due_date: due });
      }}
    >
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Action"
        required
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-[13px]"
        style={{ borderColor: T.borderSoft }}
      />
      <div className="flex gap-2">
        <select
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          className="flex-1 rounded-xl border bg-transparent px-3 py-2 text-[13px]"
          style={{ borderColor: T.borderSoft }}
        >
          {Object.entries(OWNER_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className="rounded-xl border bg-transparent px-3 py-2 text-[13px]"
          style={{ borderColor: T.borderSoft }}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full px-4 py-2 text-[12px] font-bold"
          style={{ background: T.accent, color: T.bg }}
        >
          Ajouter
        </button>
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-[12px] font-bold" style={{ color: T.muted }}>
          Annuler
        </button>
      </div>
    </form>
  );
}

function MeetingForm({
  pending,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  onCancel: () => void;
  onSubmit: (p: { title: string; scheduled_at: string; mode: string }) => void;
}) {
  const [title, setTitle] = useState("Entretien");
  const [when, setWhen] = useState("");
  const [mode, setMode] = useState("visio");
  return (
    <form
      className="mt-4 space-y-3 rounded-2xl border p-4"
      style={{ borderColor: T.borderSoft, background: T.inner }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!when) return;
        onSubmit({
          title: title.trim() || "Rendez-vous",
          scheduled_at: new Date(when).toISOString(),
          mode,
        });
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-[13px]"
        style={{ borderColor: T.borderSoft }}
      />
      <input
        type="datetime-local"
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        required
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-[13px]"
        style={{ borderColor: T.borderSoft }}
      />
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-[13px]"
        style={{ borderColor: T.borderSoft }}
      >
        {Object.entries(MODE_LABEL).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full px-4 py-2 text-[12px] font-bold"
          style={{ background: T.accent, color: T.bg }}
        >
          Planifier
        </button>
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-[12px] font-bold" style={{ color: T.muted }}>
          Annuler
        </button>
      </div>
    </form>
  );
}

function UploadForm({
  caseId,
  pending,
  onCancel,
  onDone,
  onError,
  setPending,
}: {
  caseId: string;
  pending: boolean;
  onCancel: () => void;
  onDone: (b: Bundle) => void;
  onError: (e: string) => void;
  setPending: (fn: () => void) => void;
}) {
  const [kind, setKind] = useState("rqth");
  const [title, setTitle] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [file, setFile] = useState<File | null>(null);

  return (
    <form
      className="mt-3 space-y-3 rounded-2xl border p-4"
      style={{ borderColor: T.borderSoft, background: T.inner }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!file) return;
        setPending(() => {
          void (async () => {
            const fd = new FormData();
            fd.set("kind", kind);
            fd.set("title", title);
            if (validUntil) fd.set("valid_until", validUntil);
            fd.set("file", file);
            const res = await fetch(`/api/handicap/cases/${caseId}/documents`, {
              method: "POST",
              body: fd,
            });
            const json = (await res.json().catch(() => null)) as Bundle & { error?: string };
            if (!res.ok || !json?.case) {
              onError(json?.error || "Échec du dépôt");
              return;
            }
            onDone({ case: json.case, isSuperAdmin: Boolean(json.isSuperAdmin) });
          })();
        });
      }}
    >
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value)}
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-[13px]"
        style={{ borderColor: T.borderSoft }}
      >
        <option value="rqth">RQTH</option>
        <option value="plan_signe">Plan signé</option>
        <option value="autre">Autre</option>
      </select>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre"
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-[13px]"
        style={{ borderColor: T.borderSoft }}
      />
      {kind === "rqth" ? (
        <input
          type="date"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
          className="w-full rounded-xl border bg-transparent px-3 py-2 text-[13px]"
          style={{ borderColor: T.borderSoft }}
        />
      ) : null}
      <input
        type="file"
        accept=".pdf,image/jpeg,image/png"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="w-full text-[12px]"
        style={{ color: T.muted }}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || !file}
          className="rounded-full px-4 py-2 text-[12px] font-bold"
          style={{ background: T.accent, color: T.bg }}
        >
          Déposer
        </button>
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-[12px] font-bold" style={{ color: T.muted }}>
          Annuler
        </button>
      </div>
    </form>
  );
}

function PartnerQuickAdd({
  pending,
  onAdd,
}: {
  pending: boolean;
  onAdd: (partner: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(["agefiph", "cap_emploi", "medecin_travail", "autre"] as const).map((p) => (
        <button
          key={p}
          type="button"
          disabled={pending}
          onClick={() => onAdd(p)}
          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{ background: "rgba(255,255,255,0.06)", color: T.muted }}
        >
          + {PARTNER_LABEL[p]}
        </button>
      ))}
    </div>
  );
}
