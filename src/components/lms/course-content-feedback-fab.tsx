"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, MessageSquarePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  RECLAMATION_THEMES,
  RECLAMATION_THEME_LABELS,
  type ReclamationTheme,
} from "@/lib/qualiopi/reclamation-themes";
import type { ReclamationAudience } from "@/components/qualiopi/dashboard-reclamation-form";
import { cn } from "@/lib/utils";

type Props = {
  courseId?: string | null;
  courseTitle?: string | null;
  lessonId?: string | null;
  lessonTitle?: string | null;
  audience?: ReclamationAudience;
  className?: string;
  /** Skip portal (already inside a fixed layer). */
  inline?: boolean;
};

const KIND_OPTIONS = [
  { value: "amelioration", label: "Suggestion d’amélioration" },
  { value: "erreur", label: "Erreur / faute dans le contenu" },
  { value: "bug", label: "Bug technique" },
  { value: "clarte", label: "Manque de clarté" },
  { value: "autre", label: "Autre retour" },
] as const;

export function CourseContentFeedbackFab({
  courseId,
  courseTitle,
  lessonId,
  lessonTitle,
  audience = "apprenant",
  className,
  inline = false,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<(typeof KIND_OPTIONS)[number]["value"]>("amelioration");
  const [theme, setTheme] = useState<ReclamationTheme>("contenu");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const contextLine = [
    courseTitle ? `Formation : ${courseTitle}` : courseId ? `Formation id : ${courseId}` : null,
    lessonTitle ? `Contenu : ${lessonTitle}` : lessonId ? `Contenu id : ${lessonId}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const submit = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 10) {
      toast.error("Décrivez votre retour (10 caractères min.)");
      return;
    }
    const kindLabel = KIND_OPTIONS.find((k) => k.value === kind)?.label ?? "Retour";
    const subject = `${kindLabel}${courseTitle ? ` — ${courseTitle}` : ""}${
      lessonTitle ? ` · ${lessonTitle}` : ""
    }`.slice(0, 180);
    const description = [
      kindLabel,
      contextLine || null,
      "",
      trimmed,
    ]
      .filter((line) => line != null)
      .join("\n")
      .trim();

    setSending(true);
    try {
      const res = await fetch("/api/dashboard/reclamations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience,
          theme,
          subject,
          description,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Envoi impossible");
      setSent(true);
      setMessage("");
      toast.success("Merci — votre retour est bien transmis à l’équipe.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSending(false);
    }
  };

  const panel = open ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Améliorer ce contenu"
      className="fixed inset-0 z-[80] flex items-end justify-end p-4 sm:items-end sm:p-6"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Fermer"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "relative z-[1] w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl",
          "animate-in fade-in slide-in-from-bottom-4 duration-200",
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Qualité
            </p>
            <h2 className="mt-0.5 text-base font-bold text-slate-900">Améliorer ce contenu</h2>
            <p className="mt-1 text-[12px] leading-snug text-slate-500">
              Signalez une erreur, une idée ou un bug — sans jargon, juste pour faire mieux.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          {sent ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
              Merci. Votre retour est enregistré.
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={() => setSent(false)}
              >
                Envoyer un autre retour
              </Button>
            </div>
          ) : (
            <>
              {contextLine ? (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500 whitespace-pre-line">
                  {contextLine}
                </p>
              ) : null}

              <label className="block space-y-1.5">
                <span className="text-[12px] font-semibold text-slate-700">Type de retour</span>
                <select
                  value={kind}
                  onChange={(e) =>
                    setKind(e.target.value as (typeof KIND_OPTIONS)[number]["value"])
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                >
                  {KIND_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[12px] font-semibold text-slate-700">Thématique</span>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as ReclamationTheme)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                >
                  {RECLAMATION_THEMES.map((t) => (
                    <option key={t} value={t}>
                      {RECLAMATION_THEME_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[12px] font-semibold text-slate-700">Votre message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Ex. faute d’orthographe au 2e paragraphe, quiz trop ambigu, page qui ne charge pas…"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
                />
              </label>

              <Button
                type="button"
                disabled={sending}
                onClick={() => void submit()}
                className="w-full rounded-full bg-slate-900 text-white hover:bg-slate-800"
              >
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi…
                  </>
                ) : (
                  "Envoyer mon retour"
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  ) : null;

  const trigger = (
    <button
      type="button"
      onClick={() => {
        setOpen(true);
        setSent(false);
      }}
      aria-label="Améliorer ce contenu"
      title="Améliorer ce contenu"
      className={cn(
        "fixed bottom-6 right-4 z-[70] flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-lg transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 sm:right-6",
        className,
      )}
    >
      <MessageSquarePlus className="h-4 w-4 text-slate-700" aria-hidden />
      <span className="hidden sm:inline">Améliorer</span>
    </button>
  );

  if (!mounted) return null;

  const tree = (
    <>
      {trigger}
      {panel}
    </>
  );

  if (inline) return tree;
  return createPortal(tree, document.body);
}
