"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Check,
  Eye,
  FileText,
  MoreHorizontal,
  Plus,
  Upload,
} from "lucide-react";
import { HandicapPlanEditor } from "@/components/handicap/handicap-plan-editor";
import {
  ACTION_STATUS_LABEL,
  PARTNER_STATUS_LABEL,
  PARTNER_STATUS_ORDER,
  PIPELINE_STEPS,
  accommodationCategoryLabel,
  type DisabilityCaseDetail,
} from "@/lib/handicap/case-types";
import {
  SHAREABLE_CATEGORIES,
  buildTrainerShareEmailHtml,
  containsForbiddenDisabilityTerms,
  selectAccommodationsForTrainerShare,
} from "@/lib/handicap/share-trainer-guard";
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

const ALL_PARTNERS = ["agefiph", "cap_emploi", "medecin_travail", "autre"] as const;

const MODE_LABEL: Record<string, string> = {
  visio: "Visio",
  telephone: "Téléphone",
  presentiel: "Présentiel",
};

const ACCESS_LABEL: Record<string, string> = {
  view_case: "Dossier consulté",
  open_document: "Document ouvert",
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

const PLAN_SUGGESTIONS = [
  "Transmettre les aménagements au formateur",
  "Vérifier l'accessibilité de la salle",
  "Bilan après la session",
] as const;

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

function defaultMeetingTitle(iso: string) {
  return `Entretien du ${new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`;
}

type Bundle = { case: DisabilityCaseDetail; isSuperAdmin: boolean };

type AccessDisplay =
  | {
      kind: "single";
      id: string;
      label: string;
      actorName: string | null;
      createdAt: string;
    }
  | {
      kind: "grouped";
      id: string;
      actorName: string;
      count: number;
      createdAt: string;
    };

function groupAccessLog(
  rows: DisabilityCaseDetail["accessLog"],
): AccessDisplay[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const out: AccessDisplay[] = [];
  let i = 0;
  while (i < sorted.length) {
    const cur = sorted[i];
    if (cur.action === "view_case" && cur.actorName) {
      let count = 1;
      let j = i + 1;
      const start = new Date(cur.createdAt).getTime();
      while (j < sorted.length) {
        const next = sorted[j];
        if (next.action !== "view_case" || next.actorName !== cur.actorName) break;
        const t = new Date(next.createdAt).getTime();
        if (Math.abs(start - t) > 30 * 60 * 1000) break;
        count += 1;
        j += 1;
      }
      if (count > 1) {
        out.push({
          kind: "grouped",
          id: cur.id,
          actorName: cur.actorName,
          count,
          createdAt: cur.createdAt,
        });
        i = j;
        continue;
      }
    }
    out.push({
      kind: "single",
      id: cur.id,
      label: ACCESS_LABEL[cur.action] ?? cur.action,
      actorName: cur.actorName,
      createdAt: cur.createdAt,
    });
    i += 1;
  }
  return out;
}

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
  const [showPlanUpload, setShowPlanUpload] = useState(false);
  const [planNoteOpen, setPlanNoteOpen] = useState(false);
  const [planHtml, setPlanHtml] = useState(initial.case.accompanimentPlanHtml || "");
  const [planSaved, setPlanSaved] = useState(false);
  const [consentInfo, setConsentInfo] = useState<string | null>(null);
  const [notesSaved, setNotesSaved] = useState(false);
  const [viewNotesId, setViewNotesId] = useState<string | null>(null);
  const [meetingMenuId, setMeetingMenuId] = useState<string | null>(null);
  const [editMeetingId, setEditMeetingId] = useState<string | null>(null);
  const [showAllLog, setShowAllLog] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [includeAutreIds, setIncludeAutreIds] = useState<string[]>([]);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const planTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const documentsRef = useRef<HTMLElement | null>(null);
  const c = bundle.case;

  useEffect(() => {
    setBundle(initial);
    setPlanHtml(initial.case.accompanimentPlanHtml || "");
    setPlanSaved(false);
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

  function onPlanChange(html: string) {
    setPlanHtml(html);
    setPlanSaved(false);
    if (planTimer.current) clearTimeout(planTimer.current);
    planTimer.current = setTimeout(() => {
      void mutate({ action: "save_plan", html }).then((ok) => {
        if (ok) setPlanSaved(true);
      });
    }, 800);
  }

  function openDocuments(upload = true) {
    documentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (upload) setShowUpload(true);
  }

  const openMeetings = c.meetings.filter((m) => m.status === "open");
  const closedMeetings = c.meetings.filter((m) => m.status === "closed");
  const logGrouped = useMemo(
    () => groupAccessLog(c.accessLog),
    [c.accessLog],
  );
  const logLines = showAllLog ? logGrouped : logGrouped.slice(0, 5);

  const statusPill =
    c.status === "active"
      ? { bg: "rgba(107,227,155,0.16)", color: T.green }
      : { bg: T.accentSoft, color: T.accent };

  const autrePending = c.accommodations.filter(
    (a) => a.category === "autre" && !a.sharedWithTrainerAt,
  );
  const sharePreview = useMemo(() => {
    const selected = selectAccommodationsForTrainerShare(
      c.accommodations.map((a) => ({
        id: a.id,
        label: a.label,
        details: a.details,
        category: a.category,
      })),
      { includeAutreIds },
    );
    return selected;
  }, [c.accommodations, includeAutreIds]);

  const emailPreviewHtml = useMemo(() => {
    if (!sharePreview.ok.length) return "";
    return buildTrainerShareEmailHtml({
      items: sharePreview.ok,
      appUrl: typeof window !== "undefined" ? window.location.origin : "https://www.byound.fr",
    });
  }, [sharePreview]);

  const availablePartners = ALL_PARTNERS.filter(
    (p) => !c.partners.some((x) => x.partner === p),
  );

  return (
    <div className="space-y-5">
      {error ? (
        <p
          className="rounded-2xl px-4 py-2 text-sm"
          style={{ background: "rgba(255,138,155,0.12)", color: T.red }}
        >
          {error}
        </p>
      ) : null}

      <header
        className="relative overflow-hidden rounded-[30px] border p-6"
        style={{
          borderColor: T.border,
          background:
            "radial-gradient(120% 140% at 0% 0%, #4A1028 0%, #1A1230 45%, #111831 100%)",
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div
              className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-lg font-extrabold"
              style={{ background: T.accentSoft, color: T.accent }}
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
                  style={{ background: statusPill.bg, color: statusPill.color }}
                >
                  {c.statusLabel}
                </span>
                {c.hasRqthDocument && c.rqthValidUntil ? (
                  <span
                    className="rounded-full px-3 py-1 text-[12px] font-bold"
                    style={{ background: "rgba(255,255,255,0.08)", color: T.muted }}
                  >
                    RQTH valide jusqu&apos;en {formatMonthYear(c.rqthValidUntil)}
                  </span>
                ) : c.context?.rqthDeclared || c.rqthValidUntil ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="rounded-full px-3 py-1 text-[12px] font-bold"
                      style={{ background: "rgba(242,207,107,0.15)", color: T.amber }}
                    >
                      Justificatif RQTH à déposer
                    </span>
                    <button
                      type="button"
                      onClick={() => openDocuments(true)}
                      className="rounded-full px-3 py-1 text-[12px] font-bold"
                      style={{ background: T.accent, color: T.accentOn }}
                    >
                      Déposer
                    </button>
                  </span>
                ) : null}
                {c.consentGivenAt ? (
                  <span
                    className="rounded-full px-3 py-1 text-[12px] font-bold"
                    style={{ background: "rgba(107,227,155,0.16)", color: T.green }}
                  >
                    ✓ Consentement recueilli le {formatDate(c.consentGivenAt)}
                  </span>
                ) : (
                  <span className="inline-flex flex-wrap items-center gap-2">
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
                        startTransition(async () => {
                          setConsentInfo(null);
                          const ok = await mutate({ action: "request_consent" });
                          if (ok) {
                            setConsentInfo("E-mail de consentement envoyé.");
                          }
                        });
                      }}
                      className="rounded-full px-3 py-1 text-[12px] font-bold"
                      style={{ background: T.accent, color: T.accentOn }}
                    >
                      Recueillir
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      title="Si le consentement a déjà été donné oralement"
                      onClick={() => {
                        if (confirm("Marquer le consentement comme recueilli oralement ?")) {
                          run({ action: "set_consent", consent_method: "oral" });
                        }
                      }}
                      className="rounded-full px-3 py-1 text-[12px] font-bold"
                      style={{ background: "rgba(255,255,255,0.08)", color: T.muted }}
                    >
                      Oral
                    </button>
                  </span>
                )}
              </div>
              {consentInfo ? (
                <p className="mt-2 text-[12px] font-semibold" style={{ color: T.accent }}>
                  {consentInfo}
                </p>
              ) : null}
              <p className="mt-3 text-[13px]" style={{ color: T.muted }}>
                {c.roleLine}
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
              style={{ background: T.accent, color: T.accentOn }}
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
                {bundle.isSuperAdmin && c.controlHref ? (
                  <a
                    href={c.controlHref}
                    className="block px-4 py-2 text-[13px] hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    Voir la fiche complète
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

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
                  if (confirm(`Passer à l'étape « ${step.label} » ?`)) {
                    run({ action: "set_status", status: step.id });
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-bold transition"
                style={{
                  borderColor: current ? T.accent : done ? T.green : T.borderSoft,
                  background: current
                    ? T.accentSoft
                    : done
                      ? "rgba(107,227,155,0.12)"
                      : "transparent",
                  color: current ? T.accent : done ? T.green : T.muted,
                  boxShadow: current ? `0 0 0 3px ${T.accentSoftBorder}` : undefined,
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
        <div className="space-y-5">
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

            {c.context?.needsSummary ? (
              <div
                className="mt-4 rounded-2xl border p-3"
                style={{ borderColor: T.border, background: T.inner }}
              >
                <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: T.tertiary }}>
                  Note interne — besoins déclarés
                </p>
                <p className="mt-1 text-[13px] leading-relaxed" style={{ color: T.muted }}>
                  {c.context.needsSummary}
                </p>
                <p className="mt-2 text-[11px]" style={{ color: T.tertiary }}>
                  Jamais transmise au formateur.
                </p>
              </div>
            ) : null}

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
                style={{ background: T.accent, color: T.accentOn }}
                onClick={() => {
                  setIncludeAutreIds([]);
                  setShareEmail("");
                  setShareOpen(true);
                }}
              >
                Transmettre au formateur
              </button>
            ) : null}
          </section>

          <section
            className="rounded-[24px] border p-5"
            style={{ background: T.card, borderColor: T.border }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-extrabold">Plan d&apos;accompagnement</h2>
                <p className="mt-0.5 text-[12px]" style={{ color: T.muted }}>
                  Actions suivies · note facultative · PDF signé
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPlanUpload(true);
                    openDocuments(false);
                  }}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <Upload className="h-3.5 w-3.5" /> PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowActionForm((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold"
                  style={{ background: T.accentSoft, color: T.accent }}
                >
                  <Plus className="h-3.5 w-3.5" /> Action
                </button>
              </div>
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
                <li className="rounded-2xl border border-dashed p-4" style={{ borderColor: T.borderSoft }}>
                  <p className="text-sm font-semibold" style={{ color: T.muted }}>
                    Aucune action pour le moment
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {PLAN_SUGGESTIONS.map((label) => (
                      <button
                        key={label}
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run({
                            action: "add_action",
                            label,
                            owner: "referent",
                            due_date: "",
                          })
                        }
                        className="rounded-full px-3 py-1.5 text-[12px] font-bold"
                        style={{ background: T.accentSoft, color: T.accent }}
                      >
                        + {label}
                      </button>
                    ))}
                  </div>
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
                        className="h-4 w-4 accent-[#CE0058]"
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

            <div className="mt-5 border-t pt-4" style={{ borderColor: T.borderSoft }}>
              <button
                type="button"
                onClick={() => setPlanNoteOpen((v) => !v)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="text-[13px] font-bold">Note du plan (facultatif)</span>
                <span className="text-[12px]" style={{ color: T.muted }}>
                  {planNoteOpen ? "Replier" : "Déplier"}
                </span>
              </button>
              {planNoteOpen ? (
                <div className="mt-3 space-y-2">
                  <HandicapPlanEditor
                    content={planHtml}
                    disabled={pending}
                    onChange={onPlanChange}
                  />
                  <p className="text-[11px]" style={{ color: T.tertiary }}>
                    {planSaved
                      ? "Enregistré automatiquement"
                      : planHtml
                        ? "Enregistrement…"
                        : "Vide — enregistré automatiquement à la frappe"}
                  </p>
                </div>
              ) : null}
            </div>

            {showPlanUpload ? (
              <UploadForm
                caseId={c.id}
                pending={pending}
                defaultKind="plan_signe"
                onCancel={() => setShowPlanUpload(false)}
                onDone={(b) => {
                  setBundle(b);
                  setShowPlanUpload(false);
                }}
                onError={setError}
                setPending={startTransition}
              />
            ) : null}

            {c.documents.filter((d) => d.kind === "plan_signe").length > 0 ? (
              <ul className="mt-4 space-y-2">
                {c.documents
                  .filter((d) => d.kind === "plan_signe")
                  .map((d) => (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-[13px]"
                      style={{ borderColor: T.borderSoft, background: T.inner }}
                    >
                      <span className="font-semibold">{d.title}</span>
                      <span className="text-[11px]" style={{ color: T.muted }}>
                        Plan signé · {formatDate(d.uploadedAt)}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : null}
          </section>

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

            {openMeetings.length === 0 ? (
              <p className="mt-4 text-sm" style={{ color: T.muted }}>
                Aucun rendez-vous ouvert.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {openMeetings.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border p-4"
                    style={{ borderColor: T.accentSoftBorder, background: T.inner }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-[15px] font-extrabold">{m.title}</p>
                        <p className="mt-1 text-[12px]" style={{ color: T.muted }}>
                          {formatDateTime(m.scheduledAt)}
                          {m.mode ? ` · ${MODE_LABEL[m.mode] ?? m.mode}` : ""}
                        </p>
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-full border"
                          style={{ borderColor: T.borderSoft }}
                          onClick={() =>
                            setMeetingMenuId((id) => (id === m.id ? null : m.id))
                          }
                          aria-label="Actions rendez-vous"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {meetingMenuId === m.id ? (
                          <div
                            className="absolute right-0 top-9 z-10 w-44 rounded-xl border py-1 shadow-xl"
                            style={{ background: T.card, borderColor: T.border }}
                          >
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-left text-[12px] hover:bg-white/5"
                              onClick={() => {
                                setMeetingMenuId(null);
                                setEditMeetingId(m.id);
                              }}
                            >
                              Modifier
                            </button>
                            {!m.notes.trim() ? (
                              <button
                                type="button"
                                className="block w-full px-3 py-2 text-left text-[12px] hover:bg-white/5"
                                style={{ color: T.red }}
                                onClick={() => {
                                  setMeetingMenuId(null);
                                  if (confirm("Supprimer ce rendez-vous ?")) {
                                    run({ action: "delete_meeting", meeting_id: m.id });
                                  }
                                }}
                              >
                                Supprimer
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {editMeetingId === m.id ? (
                      <MeetingEditForm
                        meeting={m}
                        pending={pending}
                        onCancel={() => setEditMeetingId(null)}
                        onSubmit={(payload) => {
                          startTransition(async () => {
                            const ok = await mutate({
                              action: "update_meeting",
                              meeting_id: m.id,
                              ...payload,
                            });
                            if (ok) setEditMeetingId(null);
                          });
                        }}
                      />
                    ) : null}

                    <textarea
                      value={m.notes}
                      onChange={(e) => onNotesChange(m.id, e.target.value)}
                      rows={4}
                      placeholder="Notes de l'entretien…"
                      className="mt-3 w-full resize-y rounded-xl border bg-transparent px-3 py-2 text-[13px] outline-none"
                      style={{ borderColor: T.borderSoft, color: T.text }}
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px]" style={{ color: T.tertiary }}>
                        Enregistré automatiquement
                        {notesSaved ? "" : ""}
                      </p>
                      <button
                        type="button"
                        disabled={pending}
                        className="rounded-full px-3 py-1.5 text-[12px] font-bold"
                        style={{ background: T.accent, color: T.accentOn }}
                        onClick={() => {
                          if (
                            confirm(
                              "Clôturer ce rendez-vous ? Les notes resteront lisibles mais non modifiables.",
                            )
                          ) {
                            run({ action: "close_meeting", meeting_id: m.id });
                          }
                        }}
                      >
                        Clôturer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
                        style={{
                          borderColor: T.borderSoft,
                          background: T.inner,
                          color: T.muted,
                        }}
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

        <div className="space-y-5">
          <section
            ref={documentsRef}
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
                        {d.kind === "plan_signe"
                          ? "Plan signé"
                          : d.kind === "rqth"
                            ? "Justificatif RQTH"
                            : "Document"}{" "}
                        · Déposé le {formatDate(d.uploadedAt)}
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
                    run({
                      action: "set_company_informed",
                      company_informed: true,
                      confirmed: true,
                    });
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

            <div className="mt-4">
              <p className="text-[13px] font-bold">Partenaires</p>
              <div className="mt-2 space-y-2">
                {c.partners.length === 0 ? (
                  <p className="text-[12px]" style={{ color: T.muted }}>
                    Aucun partenaire mobilisé.
                  </p>
                ) : (
                  c.partners.map((p) => {
                    const status = p.status || "a_contacter";
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-2 rounded-2xl border px-3 py-2.5"
                        style={{ background: T.inner, borderColor: T.borderSoft }}
                      >
                        <p className="text-[13px] font-bold">
                          {PARTNER_LABEL[p.partner] ?? p.partner}
                        </p>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            const idx = PARTNER_STATUS_ORDER.indexOf(
                              status as (typeof PARTNER_STATUS_ORDER)[number],
                            );
                            const next =
                              PARTNER_STATUS_ORDER[
                                (idx >= 0 ? idx + 1 : 0) % PARTNER_STATUS_ORDER.length
                              ];
                            run({
                              action: "set_partner_status",
                              partner_id: p.id,
                              status: next,
                            });
                          }}
                          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{
                            background:
                              status === "accorde"
                                ? "rgba(107,227,155,0.15)"
                                : status === "refuse"
                                  ? "rgba(255,138,155,0.15)"
                                  : status === "en_cours"
                                    ? "rgba(242,207,107,0.15)"
                                    : "rgba(255,255,255,0.06)",
                            color:
                              status === "accorde"
                                ? T.green
                                : status === "refuse"
                                  ? T.red
                                  : status === "en_cours"
                                    ? T.amber
                                    : T.muted,
                          }}
                          title="Cliquer pour changer le statut"
                        >
                          {PARTNER_STATUS_LABEL[status] ?? status}
                        </button>
                      </div>
                    );
                  })
                )}
                {availablePartners.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {availablePartners.map((p) => (
                      <button
                        key={p}
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run({ action: "add_partner", partner: p, status: "a_contacter" })
                        }
                        className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{ background: "rgba(255,255,255,0.06)", color: T.muted }}
                      >
                        + {PARTNER_LABEL[p]}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
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
                    className="text-[12px]"
                    style={{ color: T.muted }}
                  >
                    {l.kind === "grouped"
                      ? `Dossier consulté par ${l.actorName} · ${l.count} fois · ${relativeTime(l.createdAt)}`
                      : [l.label, l.actorName, relativeTime(l.createdAt)]
                          .filter(Boolean)
                          .join(" · ")}
                  </li>
                ))
              )}
            </ul>
            {logGrouped.length > 5 ? (
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

      {shareOpen ? (
        <ShareTrainerModal
          pending={pending}
          email={shareEmail}
          setEmail={setShareEmail}
          autrePending={autrePending}
          includeAutreIds={includeAutreIds}
          setIncludeAutreIds={setIncludeAutreIds}
          preview={sharePreview}
          emailHtml={emailPreviewHtml}
          onClose={() => setShareOpen(false)}
          onConfirm={() => {
            if (sharePreview.error) {
              setError(sharePreview.error);
              return;
            }
            if (!sharePreview.ok.length) {
              setError("Aucun aménagement à transmettre");
              return;
            }
            startTransition(async () => {
              const ok = await mutate({
                action: "share_accommodations",
                confirmed: true,
                trainer_email: shareEmail.trim(),
                include_autre_ids: includeAutreIds,
              });
              if (ok) setShareOpen(false);
            });
          }}
        />
      ) : null}
    </div>
  );
}

function ShareTrainerModal({
  pending,
  email,
  setEmail,
  autrePending,
  includeAutreIds,
  setIncludeAutreIds,
  preview,
  emailHtml,
  onClose,
  onConfirm,
}: {
  pending: boolean;
  email: string;
  setEmail: (v: string) => void;
  autrePending: DisabilityCaseDetail["accommodations"];
  includeAutreIds: string[];
  setIncludeAutreIds: (ids: string[]) => void;
  preview: ReturnType<typeof selectAccommodationsForTrainerShare>;
  emailHtml: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const shareableCount = preview.ok.filter((a) =>
    SHAREABLE_CATEGORIES.has(a.category),
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] border p-5 shadow-2xl"
        style={{ background: T.card, borderColor: T.border }}
      >
        <h3 className="text-[18px] font-extrabold">Transmettre au formateur</h3>
        <p className="mt-1 text-[13px]" style={{ color: T.muted }}>
          Catégories évaluations, supports, rythme, locaux et matériel uniquement.
          La catégorie « autre » nécessite une confirmation explicite.
        </p>

        <label className="mt-4 block text-[12px] font-bold" style={{ color: T.muted }}>
          E-mail du formateur (optionnel)
        </label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="formateur@exemple.fr"
          className="mt-1 w-full rounded-xl border bg-transparent px-3 py-2 text-[13px]"
          style={{ borderColor: T.borderSoft }}
        />

        {autrePending.length > 0 ? (
          <div className="mt-4 space-y-2">
            <p className="text-[12px] font-bold" style={{ color: T.amber }}>
              Inclure « autre » ? Confirmation requise — texte exact :
            </p>
            {autrePending.map((a) => {
              const checked = includeAutreIds.includes(a.id);
              const forbidden =
                containsForbiddenDisabilityTerms(a.label) ||
                containsForbiddenDisabilityTerms(a.details ?? "");
              return (
                <label
                  key={a.id}
                  className="flex items-start gap-2 rounded-xl border p-3 text-[13px]"
                  style={{ borderColor: T.borderSoft, background: T.inner }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={forbidden}
                    onChange={(e) => {
                      if (e.target.checked) {
                        if (
                          !confirm(
                            `Confirmer l'envoi de cet aménagement « autre » ?\n\n${a.label}${a.details ? `\n${a.details}` : ""}`,
                          )
                        ) {
                          return;
                        }
                        setIncludeAutreIds([...includeAutreIds, a.id]);
                      } else {
                        setIncludeAutreIds(includeAutreIds.filter((id) => id !== a.id));
                      }
                    }}
                    className="mt-1"
                  />
                  <span>
                    <strong>{a.label}</strong>
                    {a.details ? (
                      <span className="mt-0.5 block" style={{ color: T.muted }}>
                        {a.details}
                      </span>
                    ) : null}
                    {forbidden ? (
                      <span className="mt-1 block text-[12px]" style={{ color: T.red }}>
                        Reformulez en décrivant le besoin, sans mention du handicap.
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        ) : null}

        {preview.error ? (
          <p
            className="mt-4 rounded-xl px-3 py-2 text-[13px] font-semibold"
            style={{ background: "rgba(255,138,155,0.12)", color: T.red }}
          >
            {preview.error}
          </p>
        ) : (
          <div className="mt-4">
            <p className="text-[12px] font-bold" style={{ color: T.muted }}>
              Aperçu exact de l&apos;e-mail reçu par le formateur
              {shareableCount || preview.ok.length
                ? ` · ${preview.ok.length} aménagement(s)`
                : ""}
            </p>
            <div
              className="prose prose-invert mt-2 max-w-none rounded-xl border p-4 text-[13px]"
              style={{ borderColor: T.borderSoft, background: T.inner }}
              dangerouslySetInnerHTML={{
                __html:
                  emailHtml ||
                  "<p style='color:#9AA3BD'>Aucun aménagement sélectionné.</p>",
              }}
            />
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending || Boolean(preview.error) || !preview.ok.length}
            onClick={onConfirm}
            className="rounded-full px-4 py-2 text-[13px] font-bold disabled:opacity-50"
            style={{ background: T.accent, color: T.accentOn }}
          >
            Envoyer
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-[13px] font-bold"
            style={{ color: T.muted }}
          >
            Annuler
          </button>
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
  const [category, setCategory] = useState("supports");
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
          style={{ background: T.accent, color: T.accentOn }}
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
          style={{ background: T.accent, color: T.accentOn }}
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

function MeetingForm({
  pending,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  onCancel: () => void;
  onSubmit: (p: { title: string; scheduled_at: string; mode: string }) => void;
}) {
  const [when, setWhen] = useState("");
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState("visio");
  const [titleTouched, setTitleTouched] = useState(false);

  useEffect(() => {
    if (!titleTouched && when) {
      setTitle(defaultMeetingTitle(when));
    }
  }, [when, titleTouched]);

  return (
    <form
      className="mt-4 space-y-3 rounded-2xl border p-4"
      style={{ borderColor: T.borderSoft, background: T.inner }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!when) return;
        onSubmit({
          title: title.trim() || defaultMeetingTitle(when),
          scheduled_at: new Date(when).toISOString(),
          mode,
        });
      }}
    >
      <input
        type="datetime-local"
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        required
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-[13px]"
        style={{ borderColor: T.borderSoft }}
      />
      <input
        value={title}
        onChange={(e) => {
          setTitleTouched(true);
          setTitle(e.target.value);
        }}
        placeholder="Titre"
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
          style={{ background: T.accent, color: T.accentOn }}
        >
          Planifier
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

function MeetingEditForm({
  meeting,
  pending,
  onCancel,
  onSubmit,
}: {
  meeting: DisabilityCaseDetail["meetings"][number];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (p: { title: string; scheduled_at: string; mode: string }) => void;
}) {
  const [title, setTitle] = useState(meeting.title);
  const [when, setWhen] = useState(
    meeting.scheduledAt ? meeting.scheduledAt.slice(0, 16) : "",
  );
  const [mode, setMode] = useState(meeting.mode || "visio");
  return (
    <form
      className="mt-3 space-y-2 rounded-xl border p-3"
      style={{ borderColor: T.borderSoft }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!when) return;
        onSubmit({
          title: title.trim() || defaultMeetingTitle(when),
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
          className="rounded-full px-3 py-1.5 text-[12px] font-bold"
          style={{ background: T.accent, color: T.accentOn }}
        >
          Enregistrer
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-3 py-1.5 text-[12px] font-bold"
          style={{ color: T.muted }}
        >
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
  defaultKind = "rqth",
}: {
  caseId: string;
  pending: boolean;
  onCancel: () => void;
  onDone: (b: Bundle) => void;
  onError: (e: string) => void;
  setPending: (fn: () => void) => void;
  defaultKind?: string;
}) {
  const [kind, setKind] = useState(defaultKind);
  const [title, setTitle] = useState(
    defaultKind === "plan_signe" ? "Plan d'accompagnement signé" : "",
  );
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
            const json = (await res.json().catch(() => null)) as Bundle & {
              error?: string;
            };
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
          style={{ background: T.accent, color: T.accentOn }}
        >
          Déposer
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
