"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Mail, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  BriefingApiResponse,
  BriefingPriority,
  DailyBriefing,
} from "@/lib/crm/daily-briefing-types";

type DailyBriefingOverlayProps = {
  open: boolean;
  onClose: () => void;
};

function BriefingSkeleton() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-4 w-2/3 rounded bg-gray-200" />
      <div className="h-20 rounded-xl bg-gray-100" />
      <div className="h-40 rounded-xl bg-gray-100" />
      <div className="h-40 rounded-xl bg-gray-100" />
      <div className="h-32 rounded-xl bg-gray-100" />
    </div>
  );
}

function actionBadge(type: string) {
  if (type === "email") return "bg-blue-100 text-blue-800";
  if (type === "call") return "bg-emerald-100 text-emerald-800";
  return "bg-sky-100 text-sky-800";
}

function actionLabel(type: string) {
  if (type === "email") return "Email";
  if (type === "call") return "Appel";
  return "LinkedIn";
}

type PriorityCardProps = {
  priority: BriefingPriority;
  onEmailSent: (p: BriefingPriority, subject: string, body: string, to: string) => Promise<void>;
  onCallScriptCopied: (p: BriefingPriority) => Promise<void>;
};

function PriorityCard({ priority, onEmailSent, onCallScriptCopied }: PriorityCardProps) {
  const [emailSubject, setEmailSubject] = useState(priority.email?.subject ?? "");
  const [emailBody, setEmailBody] = useState(priority.email?.body ?? "");
  const [recipient, setRecipient] = useState(priority.contact_email ?? "");
  const [sending, setSending] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(true);

  useEffect(() => {
    setEmailSubject(priority.email?.subject ?? "");
    setEmailBody(priority.email?.body ?? "");
    setRecipient(priority.contact_email ?? "");
  }, [priority]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copié`);
    } catch {
      toast.error("Copie impossible");
    }
  };

  const copyFullEmail = () => {
    void copyText(`Objet: ${emailSubject}\n\n${emailBody}`, "Email");
  };

  const copyCallScript = async () => {
    if (!priority.call_script) return;
    const s = priority.call_script;
    const text = `Accroche: ${s.hook}\n\nPitch: ${s.pitch}\n\nSi pas le temps: ${s.objection_time}\n\nSi pas intéressé: ${s.objection_interest}\n\nObjectif: ${s.goal}`;
    await copyText(text, "Script");
    await onCallScriptCopied(priority);
  };

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            🎯 Priorité {priority.rank} — {priority.company}
          </h3>
          <p className="mt-1 text-sm italic text-gray-500">{priority.why_today}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            actionBadge(priority.action_type),
          )}
        >
          {actionLabel(priority.action_type)}
        </span>
      </div>

      {(priority.contact_name || priority.contact_role) && (
        <p className="mt-2 text-xs text-gray-600">
          {priority.contact_name ? `${priority.contact_name}` : "Contact"}
          {priority.contact_role ? ` · ${priority.contact_role}` : ""}
        </p>
      )}

      {priority.action_type === "email" && priority.email ? (
        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-800">ACTION : Envoyer un email</p>
          <div className="space-y-2">
            <label className="text-xs text-gray-500">Destinataire</label>
            <Input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="email@entreprise.fr"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-500">Objet</label>
            <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-500">Corps du message</label>
            <Textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={6}
              className="text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void copyFullEmail()}>
              <Copy className="mr-1 h-3.5 w-3.5" />
              Copier
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={sending || !recipient.trim()}
              className="bg-[#6633CC] hover:bg-[#5528b0]"
              onClick={async () => {
                setSending(true);
                try {
                  await onEmailSent(priority, emailSubject, emailBody, recipient.trim());
                } finally {
                  setSending(false);
                }
              }}
            >
              <Mail className="mr-1 h-3.5 w-3.5" />
              {sending ? "Envoi…" : "Envoyer via Resend"}
            </Button>
          </div>
        </div>
      ) : null}

      {priority.action_type === "call" && priority.call_script ? (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-semibold text-gray-800"
            onClick={() => setScriptOpen((v) => !v)}
          >
            📞 Script d&apos;appel
            <span className="text-xs text-gray-400">{scriptOpen ? "▼" : "▶"}</span>
          </button>
          {scriptOpen ? (
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>
                <strong>Accroche :</strong> {priority.call_script.hook}
              </li>
              <li>
                <strong>Pitch :</strong> {priority.call_script.pitch}
              </li>
              <li>
                <strong>Si « pas le temps » :</strong> {priority.call_script.objection_time}
              </li>
              <li>
                <strong>Si « pas intéressé » :</strong> {priority.call_script.objection_interest}
              </li>
              <li>
                <strong>Objectif :</strong> {priority.call_script.goal}
              </li>
            </ul>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void copyCallScript()}
          >
            <Copy className="mr-1 h-3.5 w-3.5" />
            Copier le script
          </Button>
        </div>
      ) : null}

      {priority.action_type === "linkedin" && priority.linkedin_message ? (
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
          <p className="text-sm font-semibold text-gray-800">Message LinkedIn</p>
          <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-800">
            {priority.linkedin_message}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void copyText(priority.linkedin_message!, "Message LinkedIn")}
          >
            <Copy className="mr-1 h-3.5 w-3.5" />
            Copier
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export function DailyBriefingOverlay({ open, onClose }: DailyBriefingOverlayProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const dateTitle = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fetchBriefing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-assistant/briefing");
      const json = (await res.json()) as BriefingApiResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Erreur réseau");
      setBriefing(json.briefing);
      setGeneratedAt(json.generated_at);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
      setBriefing(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void fetchBriefing();
  }, [open, fetchBriefing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const logBriefingAction = async (
    prospectId: string,
    actionType: "email_sent" | "call_script_copied",
    emailSubject?: string,
  ) => {
    const res = await fetch("/api/ai-assistant/briefing-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospectId, actionType, emailSubject }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(json.error ?? "Mise à jour CRM impossible");
    window.dispatchEvent(new CustomEvent("crm-updated"));
  };

  const handleEmailSent = async (
    priority: BriefingPriority,
    subject: string,
    body: string,
    to: string,
  ) => {
    if (!priority.prospect_id) {
      toast.error("Prospect introuvable dans le CRM — mise à jour manuelle requise.");
      return;
    }

    const res = await fetch("/api/resend/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, body, from: "darcy@edgebs.fr" }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(json.error ?? "Envoi impossible");

    await logBriefingAction(priority.prospect_id, "email_sent", subject);
    toast.success(`Email envoyé à ${to}`);
  };

  const handleCallScriptCopied = async (priority: BriefingPriority) => {
    if (!priority.prospect_id) return;
    try {
      await logBriefingAction(priority.prospect_id, "call_script_copied");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur CRM");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="briefing-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex h-full w-full max-h-[100dvh] flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[90vh] sm:max-w-[900px] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
          <div>
            <h2 id="briefing-title" className="text-xl font-bold text-gray-900">
              🧠 Briefing du jour
            </h2>
            <p className="text-sm text-gray-500 capitalize">{dateTitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => void fetchBriefing()}
            >
              <RefreshCw className={cn("mr-1 h-4 w-4", loading && "animate-spin")} />
              Actualiser
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? <BriefingSkeleton /> : null}
          {error && !loading ? (
            <div className="p-6 text-center">
              <p className="text-red-600">{error}</p>
              <Button className="mt-4" onClick={() => void fetchBriefing()}>
                Réessayer
              </Button>
            </div>
          ) : null}

          {briefing && !loading ? (
            <div className="space-y-6 p-4 sm:p-6">
              <section className="rounded-xl bg-gradient-to-r from-[#6633CC]/10 to-indigo-50 p-4">
                <h3 className="text-sm font-bold uppercase tracking-wide text-[#6633CC]">
                  📊 État du pipeline
                </h3>
                <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-800">
                  <span>{briefing.pipeline_status.total} prospects</span>
                  {briefing.pipeline_status.actions_overdue > 0 ? (
                    <span className="font-medium text-red-600">
                      ⚠️ {briefing.pipeline_status.actions_overdue} en retard
                    </span>
                  ) : null}
                  {briefing.pipeline_status.actions_today > 0 ? (
                    <span className="text-amber-700">
                      📅 {briefing.pipeline_status.actions_today} action(s) aujourd&apos;hui
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-gray-700">{briefing.pipeline_status.top_insight}</p>
              </section>

              {briefing.priorities.map((prio) => (
                <PriorityCard
                  key={`${prio.rank}-${prio.company}`}
                  priority={prio}
                  onEmailSent={handleEmailSent}
                  onCallScriptCopied={handleCallScriptCopied}
                />
              ))}

              {briefing.do_not_contact_today.length > 0 ? (
                <section className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                  <h3 className="font-bold text-amber-900">💡 À ne pas faire aujourd&apos;hui</h3>
                  <ul className="mt-2 space-y-2">
                    {briefing.do_not_contact_today.map((item) => (
                      <li key={item.company} className="text-sm text-amber-950">
                        <strong>{item.company}</strong> — {item.reason}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-800">
                  <strong>Conseil du jour :</strong> {briefing.daily_tip}
                </p>
                {generatedAt ? (
                  <p className="mt-2 text-[10px] text-gray-400">
                    Généré à {new Date(generatedAt).toLocaleTimeString("fr-FR")}
                  </p>
                ) : null}
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
