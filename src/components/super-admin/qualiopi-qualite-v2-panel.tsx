"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Loader2,
  Lock,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  computeDeadlineBadge,
  type ReclamationDeadlineSettings,
} from "@/lib/qualiopi/reclamation-deadlines";
import {
  formatFrDateTime,
  formatRelativeFr,
  formatDurationHours,
  sentenceCaseName,
} from "@/lib/qualiopi/reclamation-format";
import { normalizeReclamationBody } from "@/lib/qualiopi/reclamation-text";
import {
  deriveReclamationSource,
  RECLAMATION_SOURCE_LABELS,
  RECLAMATION_SOURCES,
  type ReclamationSource,
} from "@/lib/qualiopi/reclamation-sources";
import {
  RECLAMATION_STEP_LABELS,
  RECLAMATION_STEPS,
  resolveReclamationStep,
  type ReclamationStep,
} from "@/lib/qualiopi/reclamation-status";
import {
  RECLAMATION_THEME_LABELS,
  RECLAMATION_THEMES,
  type ReclamationTheme,
} from "@/lib/qualiopi/reclamation-themes";
import { QualiopiSignalementsPanel } from "@/components/super-admin/qualiopi-signalements-panel";

type Reclamation = {
  id: string;
  subject: string;
  description: string;
  status: string;
  theme?: string | null;
  source?: string | null;
  channel?: string | null;
  audience?: string | null;
  requester_name?: string | null;
  requester_email?: string | null;
  requester_role?: string | null;
  requester_company?: string | null;
  received_at: string;
  ack_at?: string | null;
  answered_at?: string | null;
  closed_at?: string | null;
  response?: string | null;
  action_id?: string | null;
  ticket_id?: string | null;
  ticket_url?: string | null;
  is_test?: boolean | null;
  resolution_note?: string | null;
};

type Message = {
  id: string;
  kind: string;
  body: string;
  author_name?: string | null;
  created_at: string;
  email_sent_at?: string | null;
};

type Action = {
  id: string;
  title: string;
  cause: string | null;
  owner_name: string | null;
  due_at: string | null;
  status: "todo" | "doing" | "done";
  source: string;
  reclamation_id?: string | null;
  highlight_id?: string | null;
  reviewed_at: string | null;
};

type Template = { id: string; key: string; label: string; body: string };

type TabId = "reclamations" | "paq" | "signalements";
type ListFilter = "todo" | "done" | "all";

const CARD = "#111831";
const INNER = "#0B1122";
const BORDER = "#1A2340";
const BORDER2 = "#26304F";
const TEXT = "#F2F4FA";
const MUTED = "#9AA3BD";
const TERT = "#6C7593";
const VIOLET = "#6E5BFF";
const GREEN = "#6BE39B";
const AMBER = "#F2CF6B";
const RED = "#FF8A9B";
const BLUE = "#8DB8FF";

function applyTemplate(body: string, subject: string): string {
  return body.replaceAll("{{subject}}", subject);
}

export function QualiopiQualiteV2Panel({ canAccessSignalements = true }: { canAccessSignalements?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab = (searchParams.get("tab") as TabId) || "reclamations";
  const selectedId = searchParams.get("id");

  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [settings, setSettings] = useState<ReclamationDeadlineSettings>({
    ackBusinessDays: 2,
    replyBusinessDays: 10,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [listFilter, setListFilter] = useState<ListFilter>("todo");
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [composerMode, setComposerMode] = useState<"reply" | "note">("reply");
  const [composerText, setComposerText] = useState("");
  const [closeAfter, setCloseAfter] = useState(false);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [paqFilter, setPaqFilter] = useState<"todo" | "doing" | "done" | "all">("all");
  const [createForm, setCreateForm] = useState({
    subject: "",
    description: "",
    theme: "outil_byound" as ReclamationTheme,
    source: "saisie_interne" as ReclamationSource,
    requester_name: "",
    requester_role: "",
    requester_company: "",
    requester_email: "",
    is_test: true,
  });
  const [actionForm, setActionForm] = useState({ title: "", cause: "", owner_name: "", due_at: "" });

  const setQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") next.delete(k);
        else next.set(k, v);
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, aRes] = await Promise.all([
        fetch("/api/super-admin/crm/qualiopi/reclamations?include_test=1"),
        fetch("/api/super-admin/crm/qualiopi/actions"),
      ]);
      const rJson = await rRes.json();
      const aJson = await aRes.json();
      if (!rRes.ok) throw new Error(rJson.error || "Réclamations");
      if (!aRes.ok) throw new Error(aJson.error || "Actions");
      setReclamations(rJson.reclamations ?? []);
      setTemplates(rJson.templates ?? []);
      if (rJson.settings) setSettings(rJson.settings);
      setActions(aJson.actions ?? []);
      if (rJson.migration_required) {
        toast.message("Migration SQL v2 à appliquer pour le fil de messages et les tickets.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => reclamations.find((r) => r.id === selectedId) ?? null,
    [reclamations, selectedId],
  );

  useEffect(() => {
    if (!selected?.id) {
      setMessages([]);
      return;
    }
    void (async () => {
      const res = await fetch(`/api/super-admin/crm/qualiopi/reclamations/${selected.id}/messages`);
      const json = await res.json();
      if (res.ok) setMessages(json.messages ?? []);
    })();
  }, [selected?.id]);

  const enriched = useMemo(() => {
    return reclamations.map((r) => {
      const step = resolveReclamationStep(r);
      const badge = computeDeadlineBadge(r, settings);
      return { r, step, badge };
    });
  }, [reclamations, settings]);

  const todoCount = enriched.filter((e) => e.step !== "closed").length;
  const doneCount = enriched.filter((e) => e.step === "closed").length;
  const openCount = todoCount;
  const overdueCount = enriched.filter((e) => e.badge.overdue).length;

  const avgReplyHours = useMemo(() => {
    const yearAgo = Date.now() - 365 * 24 * 3600 * 1000;
    const pairs = reclamations.filter(
      (r) =>
        r.received_at &&
        (r.answered_at || r.response) &&
        new Date(r.received_at).getTime() >= yearAgo &&
        !r.is_test,
    );
    if (!pairs.length) return null;
    const sum = pairs.reduce((acc, r) => {
      const end = new Date(r.answered_at || r.closed_at || r.updated_at || r.received_at).getTime();
      const start = new Date(r.received_at).getTime();
      return acc + (end - start) / 3600000;
    }, 0);
    return sum / pairs.length;
  }, [reclamations]);

  const filteredList = useMemo(() => {
    let list = enriched;
    if (listFilter === "todo") list = list.filter((e) => e.step !== "closed");
    if (listFilter === "done") list = list.filter((e) => e.step === "closed");
    if (themeFilter !== "all") list = list.filter((e) => (e.r.theme ?? "autre") === themeFilter);
    list = [...list].sort((a, b) => {
      if (a.badge.overdue !== b.badge.overdue) return a.badge.overdue ? -1 : 1;
      return new Date(b.r.received_at).getTime() - new Date(a.r.received_at).getTime();
    });
    return list;
  }, [enriched, listFilter, themeFilter]);

  const selectRec = (id: string) => {
    setQuery({ tab: "reclamations", id });
    setMobileDetail(true);
    setComposerText("");
    setComposerMode("reply");
    setCloseAfter(false);
  };

  const createReclamation = async () => {
    if (!createForm.subject.trim()) {
      toast.error("Objet requis");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/reclamations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Création impossible");
      toast.success("Réclamation créée");
      setCreateOpen(false);
      await load();
      if (json.reclamation?.id) selectRec(json.reclamation.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const sendComposer = async () => {
    if (!selected) return;
    if (!composerText.trim()) {
      toast.error("Saisissez un message");
      return;
    }
    setBusy(true);
    try {
      if (composerMode === "note") {
        const res = await fetch(`/api/super-admin/crm/qualiopi/reclamations/${selected.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "note_interne", body: composerText }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Note impossible");
        toast.success("Note interne ajoutée");
      } else {
        let resolution_note: string | null = null;
        if (closeAfter) {
          resolution_note = window.prompt("Note de résolution (facultatif)") || null;
        }
        const res = await fetch(`/api/super-admin/crm/qualiopi/reclamations/${selected.id}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: composerText,
            close_after: closeAfter,
            resolution_note,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Envoi impossible");
        toast.success(
          json.email?.skipped
            ? "Réponse enregistrée (e-mail non envoyé — hors test)"
            : "Réponse envoyée",
        );
      }
      setComposerText("");
      setCloseAfter(false);
      await load();
      const msgRes = await fetch(`/api/super-admin/crm/qualiopi/reclamations/${selected.id}/messages`);
      const msgJson = await msgRes.json();
      if (msgRes.ok) setMessages(msgJson.messages ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const createTicket = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/super-admin/crm/qualiopi/reclamations/${selected.id}/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Ticket impossible");
      toast.success(json.already ? "Ticket déjà lié" : "Ticket créé");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const createLinkedAction = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: actionForm.title || `Amélioration — ${selected.subject}`,
          cause: actionForm.cause || `${RECLAMATION_THEME_LABELS[(selected.theme as ReclamationTheme) ?? "autre"]} · ${selected.subject}`,
          owner_name: actionForm.owner_name || null,
          due_at: actionForm.due_at || null,
          source: "reclamation",
          reclamation_id: selected.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action impossible");
      await fetch(`/api/super-admin/crm/qualiopi/reclamations/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_id: json.action.id }),
      });
      toast.success("Action d'amélioration créée");
      setActionOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const markRevue = async () => {
    const res = await fetch("/api/super-admin/crm/qualiopi/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Revue qualité ${new Date().toLocaleDateString("fr-FR")}`,
        cause: "Comité / revue mensuelle",
        source: "revue",
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Revue impossible");
      return;
    }
    await fetch(`/api/super-admin/crm/qualiopi/actions/${json.action.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done", mark_reviewed: true }),
    });
    toast.success("Revue qualité enregistrée");
    await load();
  };

  const linkedAction = selected?.action_id
    ? actions.find((a) => a.id === selected.action_id)
    : null;

  const step = selected ? resolveReclamationStep(selected) : null;
  const sourceLabel = selected
    ? RECLAMATION_SOURCE_LABELS[deriveReclamationSource(selected)]
    : "";

  return (
    <div className="space-y-6" style={{ color: TEXT }}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[34px] font-extrabold leading-tight tracking-tight" style={{ color: TEXT }}>
            Réclamations et amélioration
          </h1>
          <p className="mt-1 text-sm" style={{ color: MUTED }}>
            Qualiopi · indicateurs 31 et 32
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/super-admin/crm/qualiopi/reclamations/export"
            className="inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold"
            style={{ borderColor: BORDER2, color: TEXT, background: "transparent" }}
          >
            Exporter le registre (PDF)
          </a>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center gap-1 rounded-full bg-white px-4 text-sm font-extrabold text-[#0A0F1E]"
          >
            <Plus className="h-4 w-4" /> Réclamation
          </button>
        </div>
      </div>

      {/* Tabs + counters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-full p-1" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          {(
            [
              ["reclamations", `Réclamations (${todoCount})`],
              ["paq", "Plan d'amélioration"],
              ...(canAccessSignalements ? [["signalements", "Signalements sensibles"] as const] : []),
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setQuery({ tab: id, id: id === "reclamations" ? selectedId : null })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition",
                tab === id ? "bg-white text-[#0A0F1E]" : "text-[#9AA3BD] hover:text-white",
              )}
            >
              {id === "signalements" ? <Lock className="h-3.5 w-3.5" /> : null}
              {label}
            </button>
          ))}
        </div>
        <div
          className="flex items-stretch divide-x rounded-[16px] px-1"
          style={{ background: CARD, border: `1px solid ${BORDER}`, borderColor: BORDER }}
        >
          {[
            { label: `${openCount} ouverte${openCount > 1 ? "s" : ""}`, color: openCount > 0 ? AMBER : MUTED },
            {
              label: `${overdueCount} en retard`,
              color: overdueCount > 0 ? RED : GREEN,
            },
            { label: `${formatDurationHours(avgReplyHours)} délai moyen`, color: MUTED },
          ].map((c) => (
            <div key={c.label} className="px-4 py-2.5 text-sm font-semibold" style={{ color: c.color, borderColor: BORDER2 }}>
              {c.label}
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="h-[420px] animate-pulse rounded-[24px]" style={{ background: CARD }} />
          <div className="h-[420px] animate-pulse rounded-[24px]" style={{ background: CARD }} />
        </div>
      ) : tab === "signalements" ? (
        canAccessSignalements ? (
          <QualiopiSignalementsPanel />
        ) : (
          <p className="rounded-[24px] border p-6 text-sm" style={{ borderColor: BORDER, background: CARD, color: MUTED }}>
            Accès réservé au référent signalements.
          </p>
        )
      ) : tab === "paq" ? (
        <PaqTab
          actions={actions}
          filter={paqFilter}
          setFilter={setPaqFilter}
          onRevue={() => void markRevue()}
          onReload={() => void load()}
          onOpenRec={(id) => {
            setQuery({ tab: "reclamations", id });
          }}
        />
      ) : (
        <div className="grid gap-4 max-[1100px]:grid-cols-1 min-[1101px]:grid-cols-[340px_minmax(0,1fr)]">
          {/* List */}
          <aside
            className={cn(
              "rounded-[24px] p-4",
              mobileDetail ? "max-[1100px]:hidden" : "",
            )}
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["todo", `À traiter (${todoCount})`],
                  ["done", `Résolues (${doneCount})`],
                  ["all", `Toutes (${reclamations.length})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setListFilter(id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold",
                    listFilter === id ? "bg-white text-[#0A0F1E]" : "text-[#9AA3BD]",
                  )}
                  style={listFilter === id ? undefined : { background: INNER, border: `1px solid ${BORDER2}` }}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={themeFilter}
              onChange={(e) => setThemeFilter(e.target.value)}
              className="mt-3 w-full rounded-full border px-3 py-2 text-xs"
              style={{ background: INNER, borderColor: BORDER2, color: MUTED }}
            >
              <option value="all">Toutes les catégories</option>
              {RECLAMATION_THEMES.map((t) => (
                <option key={t} value={t}>
                  {RECLAMATION_THEME_LABELS[t]}
                </option>
              ))}
            </select>

            <ul className="mt-3 max-h-[70vh] space-y-2 overflow-y-auto">
              {filteredList.length === 0 ? (
                <li
                  className="rounded-[16px] border border-dashed p-4 text-sm leading-relaxed"
                  style={{ borderColor: BORDER2, color: MUTED }}
                >
                  Les réclamations arrivent depuis les espaces client, apprenant et formateur, ou s&apos;ajoutent avec « ＋ Réclamation ».
                </li>
              ) : (
                filteredList.map(({ r, badge }) => {
                  const active = r.id === selected?.id;
                  const dot =
                    badge.overdue ? RED : resolveReclamationStep(r) === "closed" ? GREEN : AMBER;
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => selectRec(r.id)}
                        className="w-full rounded-[16px] p-3 text-left transition"
                        style={{
                          background: active ? "rgba(110,91,255,0.12)" : INNER,
                          border: `1px solid ${active ? "rgba(110,91,255,0.4)" : BORDER2}`,
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: dot }} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="line-clamp-2 text-sm font-extrabold" style={{ color: TEXT }}>
                                {r.subject}
                              </p>
                              <span className="shrink-0 text-[11px]" style={{ color: TERT }}>
                                {formatRelativeFr(r.received_at)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs" style={{ color: MUTED }}>
                              {sentenceCaseName(r.requester_name) || "—"}
                              {r.requester_company ? ` · ${sentenceCaseName(r.requester_company)}` : ""}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: BORDER2, color: MUTED }}>
                                {RECLAMATION_THEME_LABELS[(r.theme as ReclamationTheme) ?? "autre"]}
                              </span>
                              <span
                                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={{
                                  background:
                                    badge.tone === "red"
                                      ? "rgba(255,138,155,0.15)"
                                      : badge.tone === "green"
                                        ? "rgba(107,227,155,0.15)"
                                        : "rgba(242,207,107,0.15)",
                                  color:
                                    badge.tone === "red" ? RED : badge.tone === "green" ? GREEN : AMBER,
                                }}
                              >
                                {badge.label}
                              </span>
                              {r.is_test ? (
                                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: BLUE }}>
                                  Test
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </aside>

          {/* Detail */}
          <section
            className={cn(
              "rounded-[24px] overflow-hidden",
              !mobileDetail && !selected ? "max-[1100px]:hidden" : "",
              !selected ? "max-[1100px]:hidden" : "",
            )}
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            {!selected ? (
              <div className="flex h-full min-h-[420px] items-center justify-center p-8 text-sm" style={{ color: MUTED }}>
                Sélectionnez une réclamation
              </div>
            ) : (
              <>
                <div className="border-b px-[26px] py-[22px]" style={{ borderColor: BORDER }}>
                  <button
                    type="button"
                    className="mb-3 text-sm min-[1101px]:hidden"
                    style={{ color: MUTED }}
                    onClick={() => setMobileDetail(false)}
                  >
                    ‹ Retour
                  </button>
                  <h2 className="text-[22px] font-extrabold leading-snug">{selected.subject}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ background: "rgba(242,207,107,0.15)", color: AMBER }}
                    >
                      {step ? RECLAMATION_STEP_LABELS[step] : "—"}
                    </span>
                    <select
                      value={selected.theme ?? "autre"}
                      onChange={(e) =>
                        void fetch(`/api/super-admin/crm/qualiopi/reclamations/${selected.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ theme: e.target.value }),
                        }).then(() => load())
                      }
                      className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                      style={{ background: INNER, borderColor: BORDER2, color: MUTED }}
                    >
                      {RECLAMATION_THEMES.map((t) => (
                        <option key={t} value={t}>
                          {RECLAMATION_THEME_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-2 text-xs" style={{ color: MUTED }}>
                    Reçue {formatFrDateTime(selected.received_at)} · via {sourceLabel}
                  </p>
                </div>

                {/* Steps */}
                <div className="flex justify-between gap-2 px-6 py-4">
                  {RECLAMATION_STEPS.map((s, i) => {
                    const current = step ? RECLAMATION_STEPS.indexOf(step) : 0;
                    const done = i < current || (step === "closed" && s === "closed");
                    const active = s === step;
                    const ts =
                      s === "received"
                        ? selected.received_at
                        : s === "acknowledged"
                          ? selected.ack_at
                          : s === "answered"
                            ? selected.answered_at
                            : s === "closed"
                              ? selected.closed_at
                              : null;
                    return (
                      <div key={s} className="flex flex-1 flex-col items-center text-center">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            background: done || active ? (active ? AMBER : GREEN) : "transparent",
                            color: done || active ? "#0A0F1E" : TERT,
                            border: active ? `2px solid ${AMBER}` : done ? "none" : `1px solid ${BORDER2}`,
                            boxShadow: active ? `0 0 0 4px rgba(242,207,107,0.25)` : undefined,
                          }}
                        >
                          {done && !active ? "✓" : i + 1}
                        </div>
                        <p className="mt-2 text-[11px] font-semibold" style={{ color: done || active ? TEXT : TERT }}>
                          {RECLAMATION_STEP_LABELS[s]}
                        </p>
                        {ts ? (
                          <p className="mt-0.5 text-[11px]" style={{ color: TERT }}>
                            {formatFrDateTime(ts)}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {/* Thread */}
                <div className="space-y-3 px-6 pb-4">
                  {messages.map((m) => {
                    if (m.kind === "system_step") {
                      return (
                        <p key={m.id} className="text-center text-[11px]" style={{ color: TERT }}>
                          {m.body} · {formatFrDateTime(m.created_at)}
                        </p>
                      );
                    }
                    if (m.kind === "note_interne") {
                      return (
                        <div
                          key={m.id}
                          className="rounded-[18px] px-4 py-3"
                          style={{ background: "rgba(242,207,107,0.08)", border: `1px solid rgba(242,207,107,0.2)` }}
                        >
                          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: AMBER }}>
                            Note interne
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm">{normalizeReclamationBody(m.body)}</p>
                        </div>
                      );
                    }
                    if (m.kind === "reply") {
                      return (
                        <div key={m.id} className="ml-8 rounded-[18px] px-4 py-3" style={{ background: "rgba(110,91,255,0.12)" }}>
                          <p className="whitespace-pre-wrap text-sm">{normalizeReclamationBody(m.body)}</p>
                          <p className="mt-2 text-[11px]" style={{ color: MUTED }}>
                            Envoyé par {sentenceCaseName(m.author_name) || "Équipe"} · {formatFrDateTime(m.created_at)}
                          </p>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={m.id}
                        className="mr-8 rounded-[18px] rounded-tl-[4px] px-4 py-3"
                        style={{ background: INNER }}
                      >
                        <p className="text-xs font-semibold" style={{ color: MUTED }} title={selected.requester_email || undefined}>
                          {sentenceCaseName(selected.requester_name) || "Demandeur"}
                          {selected.requester_role || selected.requester_company
                            ? ` · ${[selected.requester_role, selected.requester_company].filter(Boolean).map(sentenceCaseName).join(", ")}`
                            : ""}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{normalizeReclamationBody(m.body)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Tech suggestion */}
                {(selected.theme ?? "") === "outil_byound" && !selected.ticket_id ? (
                  <div
                    className="mx-6 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[16px] px-4 py-3"
                    style={{ background: "rgba(141,184,255,0.08)", border: `1px solid rgba(141,184,255,0.2)` }}
                  >
                    <div>
                      <p className="text-sm font-semibold" style={{ color: BLUE }}>
                        Ça ressemble à un problème technique
                      </p>
                      <p className="text-xs" style={{ color: MUTED }}>
                        Créer un ticket pour l&apos;équipe produit, lié à cette réclamation
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void createTicket()}
                      className="rounded-full px-3 py-1.5 text-xs font-bold"
                      style={{ background: BLUE, color: "#0A0F1E" }}
                    >
                      Créer un ticket
                    </button>
                  </div>
                ) : selected.ticket_id ? (
                  <div className="mx-6 mb-4 rounded-[16px] px-4 py-3 text-sm" style={{ background: INNER, color: MUTED }}>
                    Ticket #{String(selected.ticket_id).slice(0, 8)} · ouvert
                    {selected.ticket_url ? (
                      <a href={selected.ticket_url} className="ml-2 underline" style={{ color: BLUE }}>
                        Voir
                      </a>
                    ) : null}
                  </div>
                ) : null}

                {/* Composer */}
                <div
                  className="mx-6 mb-4 rounded-[18px] p-4"
                  style={{
                    background: composerMode === "note" ? "rgba(242,207,107,0.06)" : INNER,
                    border: `1px solid ${BORDER2}`,
                  }}
                >
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setComposerMode("reply")}
                      className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", composerMode === "reply" && "bg-white text-[#0A0F1E]")}
                      style={composerMode === "reply" ? undefined : { color: MUTED }}
                    >
                      ✉ Répondre à {sentenceCaseName(selected.requester_name)?.split(" ")[0] || "demandeur"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setComposerMode("note")}
                      className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", composerMode === "note" && "bg-white text-[#0A0F1E]")}
                      style={composerMode === "note" ? undefined : { color: MUTED }}
                    >
                      ✎ Note interne
                    </button>
                  </div>
                  {composerMode === "reply" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {templates.map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => setComposerText(applyTemplate(t.body, selected.subject))}
                          className="rounded-full px-3 py-1 text-[11px] font-semibold"
                          style={{ background: BORDER2, color: MUTED }}
                        >
                          {t.label}
                        </button>
                      ))}
                      {!templates.length ? (
                        <>
                          {[
                            ["ack", "Accusé de réception"],
                            ["tech", "Problème technique pris en charge"],
                            ["precision", "Demande de précisions"],
                          ].map(([k, label]) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() =>
                                setComposerText(
                                  applyTemplate(
                                    k === "ack"
                                      ? "Bonjour,\n\nNous avons bien reçu votre réclamation concernant « {{subject}} ».\nNous en accusons réception.\n\nCordialement,\nL’équipe Qualité Byound"
                                      : k === "tech"
                                        ? "Bonjour,\n\nNous prenons en charge le problème technique lié à « {{subject}} ».\n\nCordialement,\nL’équipe Qualité Byound"
                                        : "Bonjour,\n\nPourriez-vous préciser le contexte de « {{subject}} » ?\n\nMerci,\nL’équipe Qualité Byound",
                                    selected.subject,
                                  ),
                                )
                              }
                              className="rounded-full px-3 py-1 text-[11px] font-semibold"
                              style={{ background: BORDER2, color: MUTED }}
                            >
                              {label}
                            </button>
                          ))}
                        </>
                      ) : null}
                    </div>
                  ) : null}
                  <textarea
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder={composerMode === "note" ? "Note interne…" : "Votre réponse…"}
                    className="mt-3 min-h-[92px] w-full rounded-[14px] border bg-transparent px-3 py-2 text-sm outline-none"
                    style={{ borderColor: BORDER2, color: TEXT }}
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    {composerMode === "reply" ? (
                      <label className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
                        <input
                          type="checkbox"
                          checked={closeAfter}
                          onChange={(e) => setCloseAfter(e.target.checked)}
                        />
                        Marquer comme résolue après l&apos;envoi
                      </label>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void sendComposer()}
                      className="rounded-full px-5 py-2 text-sm font-extrabold text-white"
                      style={{ background: VIOLET }}
                    >
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : composerMode === "note" ? "Ajouter la note" : "Envoyer"}
                    </button>
                  </div>
                </div>

                {/* PAQ link */}
                <div className="mx-6 mb-6">
                  {!linkedAction ? (
                    <div
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-dashed px-4 py-3"
                      style={{ borderColor: BORDER2 }}
                    >
                      <div className="flex items-start gap-2">
                        <ArrowUpRight className="mt-0.5 h-4 w-4" style={{ color: GREEN }} />
                        <div>
                          <p className="text-sm font-semibold">Action d&apos;amélioration</p>
                          <p className="text-xs" style={{ color: MUTED }}>
                            Aucune action liée. La cause et la réclamation seront reprises dans le plan d&apos;amélioration.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActionForm({
                            title: `Amélioration — ${selected.subject}`,
                            cause: `${RECLAMATION_THEME_LABELS[(selected.theme as ReclamationTheme) ?? "autre"]} · ${selected.subject}`,
                            owner_name: "",
                            due_at: "",
                          });
                          setActionOpen(true);
                        }}
                        className="rounded-full px-3 py-1.5 text-xs font-bold"
                        style={{ background: GREEN, color: "#0A0F1E" }}
                      >
                        ＋ Créer une action
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-[16px] px-4 py-3" style={{ background: INNER, border: `1px solid ${BORDER2}` }}>
                      <p className="text-sm font-semibold">{linkedAction.title}</p>
                      <p className="mt-1 text-xs" style={{ color: MUTED }}>
                        {linkedAction.owner_name || "Sans responsable"}
                        {linkedAction.due_at ? ` · échéance ${linkedAction.due_at}` : ""}
                        {" · "}
                        {linkedAction.status === "done" ? "Faite" : linkedAction.status === "doing" ? "En cours" : "À faire"}
                      </p>
                      <button
                        type="button"
                        className="mt-2 text-xs font-semibold underline"
                        style={{ color: VIOLET }}
                        onClick={() => setQuery({ tab: "paq", id: null })}
                      >
                        Voir dans le plan
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* Create modal */}
      {createOpen ? (
        <Modal title="Nouvelle réclamation" onClose={() => setCreateOpen(false)}>
          <div className="space-y-3">
            <Field label="Catégorie">
              <select
                value={createForm.theme}
                onChange={(e) => setCreateForm((f) => ({ ...f, theme: e.target.value as ReclamationTheme }))}
                className="field"
              >
                {RECLAMATION_THEMES.map((t) => (
                  <option key={t} value={t}>
                    {RECLAMATION_THEME_LABELS[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Source">
              <select
                value={createForm.source}
                onChange={(e) => setCreateForm((f) => ({ ...f, source: e.target.value as ReclamationSource }))}
                className="field"
              >
                {RECLAMATION_SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {RECLAMATION_SOURCE_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Objet">
              <input
                className="field"
                value={createForm.subject}
                onChange={(e) => setCreateForm((f) => ({ ...f, subject: e.target.value }))}
              />
            </Field>
            <Field label="Description">
              <textarea
                className="field min-h-24"
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Demandeur">
                <input
                  className="field"
                  value={createForm.requester_name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, requester_name: e.target.value }))}
                />
              </Field>
              <Field label="Fonction">
                <input
                  className="field"
                  value={createForm.requester_role}
                  onChange={(e) => setCreateForm((f) => ({ ...f, requester_role: e.target.value }))}
                />
              </Field>
              <Field label="Entreprise">
                <input
                  className="field"
                  value={createForm.requester_company}
                  onChange={(e) => setCreateForm((f) => ({ ...f, requester_company: e.target.value }))}
                />
              </Field>
              <Field label="E-mail">
                <input
                  className="field"
                  value={createForm.requester_email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, requester_email: e.target.value }))}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
              <input
                type="checkbox"
                checked={createForm.is_test}
                onChange={(e) => setCreateForm((f) => ({ ...f, is_test: e.target.checked }))}
              />
              Compte de test (exclus export / compteurs Qualiopi)
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => void createReclamation()}
              className="w-full rounded-full py-2.5 text-sm font-extrabold text-white"
              style={{ background: VIOLET }}
            >
              Créer
            </button>
          </div>
          <style jsx>{`
            :global(.field) {
              width: 100%;
              border-radius: 12px;
              border: 1px solid ${BORDER2};
              background: ${INNER};
              padding: 8px 12px;
              color: ${TEXT};
              font-size: 14px;
            }
          `}</style>
        </Modal>
      ) : null}

      {actionOpen ? (
        <Modal title="Créer une action d'amélioration" onClose={() => setActionOpen(false)}>
          <div className="space-y-3">
            <Field label="Action">
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ background: INNER, borderColor: BORDER2, color: TEXT }}
                value={actionForm.title}
                onChange={(e) => setActionForm((f) => ({ ...f, title: e.target.value }))}
              />
            </Field>
            <Field label="Cause ou origine">
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ background: INNER, borderColor: BORDER2, color: TEXT }}
                value={actionForm.cause}
                onChange={(e) => setActionForm((f) => ({ ...f, cause: e.target.value }))}
              />
            </Field>
            <Field label="Responsable">
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ background: INNER, borderColor: BORDER2, color: TEXT }}
                value={actionForm.owner_name}
                onChange={(e) => setActionForm((f) => ({ ...f, owner_name: e.target.value }))}
              />
            </Field>
            <Field label="Échéance">
              <input
                type="date"
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ background: INNER, borderColor: BORDER2, color: TEXT }}
                value={actionForm.due_at}
                onChange={(e) => setActionForm((f) => ({ ...f, due_at: e.target.value }))}
              />
            </Field>
            <button
              type="button"
              disabled={busy}
              onClick={() => void createLinkedAction()}
              className="w-full rounded-full py-2.5 text-sm font-extrabold"
              style={{ background: GREEN, color: "#0A0F1E" }}
            >
              Créer l&apos;action
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-xs font-semibold" style={{ color: MUTED }}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[24px] p-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-extrabold" style={{ color: TEXT }}>
            {title}
          </h3>
          <button type="button" onClick={onClose} className="text-sm" style={{ color: MUTED }}>
            Fermer
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PaqTab({
  actions,
  filter,
  setFilter,
  onRevue,
  onReload,
  onOpenRec,
}: {
  actions: Action[];
  filter: "todo" | "doing" | "done" | "all";
  setFilter: (f: "todo" | "doing" | "done" | "all") => void;
  onRevue: () => void;
  onReload: () => void;
  onOpenRec: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [cause, setCause] = useState("");
  const filtered = actions.filter((a) => (filter === "all" ? true : a.status === filter));

  const add = async () => {
    const res = await fetch("/api/super-admin/crm/qualiopi/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, cause, source: "manual" }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error || "Création impossible");
      return;
    }
    setTitle("");
    setCause("");
    toast.success("Action créée");
    onReload();
  };

  return (
    <div className="rounded-[24px] p-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Plan d&apos;amélioration</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onRevue} className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: INNER, border: `1px solid ${BORDER2}`, color: TEXT }}>
            Enregistrer une revue qualité
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", "todo", "doing", "done"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", filter === f ? "bg-white text-[#0A0F1E]" : "")}
            style={filter === f ? undefined : { color: MUTED, background: INNER }}
          >
            {f === "all" ? "Toutes" : f === "todo" ? "À faire" : f === "doing" ? "En cours" : "Faites"}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Action"
          className="rounded-xl border px-3 py-2 text-sm"
          style={{ background: INNER, borderColor: BORDER2, color: TEXT }}
        />
        <input
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          placeholder="Origine"
          className="rounded-xl border px-3 py-2 text-sm"
          style={{ background: INNER, borderColor: BORDER2, color: TEXT }}
        />
        <button type="button" onClick={() => void add()} className="rounded-full px-4 py-2 text-sm font-bold" style={{ background: GREEN, color: "#0A0F1E" }}>
          ＋ Action
        </button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead style={{ color: TERT }}>
            <tr className="border-b" style={{ borderColor: BORDER }}>
              <th className="py-2 font-semibold">Action</th>
              <th className="py-2 font-semibold">Origine</th>
              <th className="py-2 font-semibold">Responsable</th>
              <th className="py-2 font-semibold">Échéance</th>
              <th className="py-2 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-b" style={{ borderColor: BORDER }}>
                <td className="py-3 font-semibold">{a.title}</td>
                <td className="py-3" style={{ color: MUTED }}>
                  {a.source === "veille" || a.highlight_id ? (
                    <a
                      href={
                        a.highlight_id
                          ? `/super/crm/qualiopi/veilles?highlight=${a.highlight_id}`
                          : "/super/crm/qualiopi/veilles"
                      }
                      className="underline"
                      style={{ color: VIOLET }}
                    >
                      {a.cause?.startsWith("Veille ind.")
                        ? a.cause.split(" · ")[0]
                        : "Veille ind. 23/24/25"}
                    </a>
                  ) : (
                    a.source
                  )}
                  {a.reclamation_id ? (
                    <button type="button" className="ml-2 underline" style={{ color: VIOLET }} onClick={() => onOpenRec(a.reclamation_id!)}>
                      Voir réclamation
                    </button>
                  ) : null}
                </td>
                <td className="py-3" style={{ color: MUTED }}>
                  {!a.owner_name || String(a.owner_name).toLowerCase() === "null" ? "—" : a.owner_name}
                </td>
                <td className="py-3" style={{ color: MUTED }}>
                  {a.due_at || "—"}
                </td>
                <td className="py-3">
                  <select
                    value={a.status}
                    onChange={(e) =>
                      void fetch(`/api/super-admin/crm/qualiopi/actions/${a.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: e.target.value }),
                      }).then(onReload)
                    }
                    className="rounded-full border px-2 py-1 text-xs"
                    style={{ background: INNER, borderColor: BORDER2, color: TEXT }}
                  >
                    <option value="todo">À faire</option>
                    <option value="doing">En cours</option>
                    <option value="done">Faite</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
