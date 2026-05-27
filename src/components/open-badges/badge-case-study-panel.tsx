"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlignLeft,
  Bold,
  ChevronLeft,
  ChevronRight,
  Italic,
  List,
  ListOrdered,
  PanelLeftOpen,
  Underline,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BadgeMethodConfig } from "@/lib/openbadges/badge-method-config";
import {
  getCaseStudyContext,
  getCaseStudyLearnerPrompt,
} from "@/lib/openbadges/badge-method-config";

const DEFAULT_HTML = "<p>Rédigez votre analyse ici.</p>";

type IntegrityProps = {
  startWriting: () => void;
  stopWriting: () => void;
  integrityFailed: boolean;
};

type Props = {
  method: BadgeMethodConfig;
  loading?: boolean;
  integrityProps: IntegrityProps;
  onSubmit: (responseHtml: string) => void;
};

export function BadgeCaseStudyPanel({ method, loading, integrityProps, onSubmit }: Props) {
  const consigne = getCaseStudyLearnerPrompt(method);
  const context = getCaseStudyContext(method);
  const [panelOpen, setPanelOpen] = useState(true);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = DEFAULT_HTML;
  }, []);

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const handleInput = () => {
    integrityProps.startWriting();
  };

  const plainText = () =>
    (editorRef.current?.innerText ?? "").replace(/\s+/g, " ").trim();

  const handleSubmit = () => {
    const html = editorRef.current?.innerHTML?.trim() ?? "";
    const text = plainText();
    if (!text) {
      toast.error("Rédigez votre étude de cas avant d'envoyer.");
      return;
    }
    onSubmit(html);
  };

  const toolbar = [
    { label: "Gras", icon: Bold, action: () => exec("bold") },
    { label: "Italique", icon: Italic, action: () => exec("italic") },
    { label: "Souligné", icon: Underline, action: () => exec("underline") },
    { label: "Liste", icon: List, action: () => exec("insertUnorderedList") },
    { label: "Liste numérotée", icon: ListOrdered, action: () => exec("insertOrderedList") },
    { label: "Paragraphe", icon: AlignLeft, action: () => exec("formatBlock", "P") },
  ];

  return (
    <div className="apprenant-studio-light w-full text-slate-900">
      <p className="mb-4 text-sm text-slate-600">
        Consultez la consigne à gauche, rédigez votre production puis envoyez. Réduisez le panneau pour
        gagner de la place.
      </p>

      {!panelOpen ? (
        <div className="mb-4 flex lg:hidden">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl border-slate-300 bg-white py-6 text-sm font-medium"
            onClick={() => setPanelOpen(true)}
          >
            <PanelLeftOpen className="mr-2 inline h-4 w-4" />
            Afficher la consigne
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-0">
        <aside
          className={cn(
            "order-2 flex shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-[width] duration-300 lg:order-1 lg:rounded-r-none lg:border-r-0",
            panelOpen
              ? "w-full lg:max-w-[min(460px,44vw)] lg:min-w-[280px]"
              : "hidden w-full lg:flex lg:w-14 lg:min-w-[3.5rem] lg:flex-col lg:rounded-2xl lg:border lg:border-slate-200 lg:bg-white lg:shadow-sm",
          )}
        >
          {panelOpen ? (
            <div className="flex min-h-0 max-h-[min(72vh,720px)] flex-1 flex-col">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-700">
                  Consigne
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  aria-label="Réduire le panneau"
                  onClick={() => setPanelOpen(false)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </div>
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4">
                {context ? (
                  <div>
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                      Contexte
                    </h2>
                    <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-900">
                      {context}
                    </div>
                  </div>
                ) : null}
                {consigne ? (
                  <div>
                    <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                      Consigne
                    </h2>
                    <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-900">
                      {consigne}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-sm text-slate-500">
                    Aucune consigne configurée pour cette épreuve.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden min-h-[240px] flex-col items-center py-4 lg:flex">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                aria-label="Afficher la consigne"
                onClick={() => setPanelOpen(true)}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
              <span
                className="mt-6 text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400 [writing-mode:vertical-rl] rotate-180"
                aria-hidden
              >
                Consigne
              </span>
            </div>
          )}
        </aside>

        <div className="order-1 min-w-0 flex-1 lg:order-2 lg:rounded-2xl lg:rounded-l-none lg:border lg:border-l-0 lg:border-slate-200 lg:bg-white lg:shadow-sm">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:border-0 lg:shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-700">
                Votre rédaction
              </h2>
              <Button
                type="button"
                size="sm"
                disabled={loading}
                className="rounded-full bg-[#FF3B30] px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-[#e6352b]"
                onClick={handleSubmit}
              >
                {loading ? "Envoi…" : "Envoyer l'étude de cas"}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 px-3 py-2">
              {toolbar.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  title={item.label}
                  onClick={item.action}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  <item.icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            {integrityProps.integrityFailed ? (
              <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
                Changement d&apos;onglet détecté — signalé à l&apos;évaluateur.
              </p>
            ) : (
              <p className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
                Restez sur cet onglet pendant votre rédaction.
              </p>
            )}

            <div className="p-4">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onFocus={integrityProps.startWriting}
                onBlur={integrityProps.stopWriting}
                className="min-h-[min(50vh,480px)] w-full rounded-xl border border-slate-200 bg-white p-6 text-base leading-7 text-slate-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-300 [&_h2]:text-xl [&_h2]:font-semibold"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
