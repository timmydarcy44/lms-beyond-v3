"use client";

import { useCallback, useRef, useState } from "react";
import { ArrowUp, ChevronRight, Sparkles } from "lucide-react";
import { EdgeSalesAssistantDialog } from "@/components/edge-lab/edge-sales-assistant-dialog";

const SUGGESTIONS = [
  "Les parcours EDGE sont-ils reconnus ?",
  "Combien de temps par semaine en moyenne ?",
  "Puis-je financer via mon entreprise ?",
  "Qu’est-ce qu’un livrable concret ?",
  "Comment valide-t-on une compétence ?",
] as const;

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_EDGE_CONTACT_EMAIL ?? "";

type Props = {
  /** `hero` : en bas de la hero, sur la photo (ligne de flottaison) */
  variant?: "dark" | "light" | "hero";
};

export function EdgeHeroFaqBar({ variant = "dark" }: Props) {
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogQuestion, setDialogQuestion] = useState("");
  const [dialogAnswer, setDialogAnswer] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isLight = variant === "light";
  const isHero = variant === "hero";

  const buildAnswer = useCallback((text: string) => {
    const q = text.trim();
    const ql = q.toLowerCase();
    if (!q) return "";

    if (/(reconnu|reconnue|certif|certification|badge|open badge|état|etat)/i.test(ql)) {
      return "Oui : les compétences sont validées par des livrables concrets et peuvent être reconnues via des Open Badges et/ou des parcours certifiants selon les programmes. L’idée : prouver, pas seulement suivre.";
    }
    if (/(temps|semaine|rythme|horaire|heures)/i.test(ql)) {
      return "La plupart des formats sont pensés pour s’intégrer à une semaine chargée : progression à votre rythme, avec des objectifs clairs. On vous aide à choisir un parcours adapté à votre disponibilité (intensif ou progressif).";
    }
    if (/(financ|cpf|opco|entreprise|budget|tarif|prix)/i.test(ql)) {
      return "Oui, c’est souvent possible via l’entreprise (budget formation / dispositifs internes) et selon le contexte via des solutions de financement. Consultez la page tarifs du parcours qui vous intéresse ou contactez-nous pour un devis personnalisé.";
    }
    if (/(livrable|preuve|projet|cas réel|cas reel|simulation)/i.test(ql)) {
      return "Un livrable concret, c’est une production exploitable (pitch, script, plan d’action, analyse, dashboard, séquence commerciale, etc.). C’est ce qui permet de valider la compétence : vous repartez avec du tangible.";
    }
    if (/(valide|validation|évaluer|evaluer|preuve|badge)/i.test(ql)) {
      return "La validation se fait par la réalisation d’un livrable (ou d’une mise en situation). Vous montrez une compétence en action, puis elle est vérifiable — ce qui crée de la crédibilité et de la progression mesurable.";
    }

    return "EDGE est conçu pour apprendre en faisant et prouver ses compétences. Dites-moi votre objectif (monter en compétences, évoluer, préparer un métier) et je vous recommande le format le plus adapté.";
  }, []);

  const sendQuestion = useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q) return;

      setDialogQuestion(q);
      setDialogAnswer(buildAnswer(q));
      setDialogOpen(true);

      if (CONTACT_EMAIL) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#contact`);
      }
    },
    [buildAnswer],
  );

  return (
    <div
      className={
        isLight
          ? "relative z-20 w-full border-t border-black/[0.06] bg-white px-5 py-10 sm:px-10"
          : "relative z-20 mt-auto w-full shrink-0 px-4 pb-6 pt-2 sm:px-6 sm:pb-8"
      }
    >
      <div
        className={
          isLight
            ? "mx-auto max-w-3xl"
            : isHero
              ? "mx-auto max-w-3xl rounded-2xl bg-black/40 p-4 sm:p-5"
              : "mx-auto max-w-3xl rounded-2xl bg-black/40 p-4 backdrop-blur-2xl sm:p-5"
        }
      >
        <EdgeSalesAssistantDialog
          open={dialogOpen}
          question={dialogQuestion}
          answer={dialogAnswer}
          onClose={() => setDialogOpen(false)}
        />

        <div
          className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuery(s);
                inputRef.current?.focus();
                sendQuestion(s);
              }}
              className={
                isLight
                  ? "group flex shrink-0 snap-start items-center gap-2 rounded-full border border-black/[0.08] bg-edge-grey py-2.5 pl-4 pr-3 text-left text-[13px] font-medium text-edge-black transition hover:border-edge-red/30"
                  : "group flex shrink-0 snap-start items-center gap-2 rounded-full bg-white/[0.08] py-2.5 pl-4 pr-3 text-left text-[13px] font-medium text-white/90 transition hover:bg-white/[0.12]"
              }
            >
              <span className="max-w-[240px] truncate sm:max-w-[280px]">{s}</span>
              <ChevronRight
                className={
                  isLight
                    ? "h-4 w-4 shrink-0 text-black/30 transition group-hover:translate-x-0.5 group-hover:text-edge-red"
                    : "h-4 w-4 shrink-0 text-white/35 transition group-hover:translate-x-0.5 group-hover:text-white/70"
                }
              />
            </button>
          ))}
        </div>

        <form
          className={
            isLight
              ? "flex items-center gap-2 rounded-full border border-black/[0.12] bg-white py-1.5 pl-4 pr-1.5"
              : "flex items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-1.5"
          }
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion(query);
          }}
        >
          <Sparkles className={`h-5 w-5 shrink-0 ${isLight ? "text-edge-red/60" : "text-edge-black/40"}`} aria-hidden />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Posez n'importe quelle question…"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-edge-black placeholder:text-black/40 focus:outline-none"
            aria-label="Votre question"
          />
          <button
            type="submit"
            className={
              isLight || isHero
                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-edge-red text-white transition hover:opacity-90"
                : "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-edge-black text-white transition hover:bg-edge-dark"
            }
            aria-label="Envoyer la question"
          >
            <ArrowUp className="h-5 w-5" strokeWidth={2} />
          </button>
        </form>

        <p className={`mt-3 text-center text-[11px] ${isLight ? "text-black/35" : "text-white/35"}`}>
          Besoin d&apos;un avis humain ?{" "}
          <a
            href="#contact"
            className={
              isLight
                ? "underline decoration-black/15 underline-offset-2 hover:text-edge-black"
                : "underline decoration-white/20 underline-offset-2 hover:text-white/60"
            }
          >
            Contactez-nous
          </a>
          .
        </p>
      </div>
    </div>
  );
}
