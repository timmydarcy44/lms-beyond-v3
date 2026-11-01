"use client";

import { useState } from "react";
import { listPlaygroundActivities, type PlaygroundActivity } from "@/lib/openbadges/playground-activity";
import type { BadgeMethodConfig } from "@/lib/openbadges/badge-method-config";
import { PassageButton } from "@/components/open-badges/passage/passage-chrome";

type Line = { from: "character" | "candidate"; text: string };

export function PassageSituation({
  method,
  onSubmit,
}: {
  method: BadgeMethodConfig;
  onSubmit: (text: string) => void;
}) {
  const activity = listPlaygroundActivities(method.playground)[0] as PlaygroundActivity | undefined;
  const situation = activity?.situation;
  const moments = situation?.moments ?? [];
  const [step, setStep] = useState(0);
  const [lines, setLines] = useState<Line[]>([
    {
      from: "character",
      text: situation?.character
        ? `Bonjour, je suis ${situation.character}. ${activity?.learnerPrompt || ""}`.trim()
        : activity?.learnerPrompt || "Décrivez votre démarche.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [why, setWhy] = useState("");
  const moment = moments[step];
  const sandbox = activity?.type !== "situation";

  const push = (text: string) => {
    const next = text.trim();
    if (!next) return;
    setLines((current) => [
      ...current,
      { from: "candidate", text: next },
      {
        from: "character",
        text: sandbox
          ? "Je note cette piste. Précisez le geste que vous feriez ensuite."
          : "Je vous écoute. Qu'est-ce qui vous fait dire ça ?",
      },
    ]);
    setDraft("");
  };

  if (activity?.type === "module") {
    return (
      <div className="px-4 py-8 sm:px-6">
        <p className="text-sm text-[#B4B8C8]">
          Module {activity.module?.fileName || "interactif"}. Le lecteur s&apos;ouvre dans un cadre isolé lorsque le fichier est hébergé.
        </p>
        <div className="mt-4 h-64 rounded-3xl border border-[#1E2130] bg-[#15171E]" />
        <div className="mt-4">
          <PassageButton onClick={() => onSubmit(`Module terminé : ${activity.module?.fileName || activity.id}`)}>
            Terminer
          </PassageButton>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[calc(100vh-120px)] lg:grid-cols-[1fr_280px]">
      <section className="flex flex-col px-4 py-4 sm:px-6">
        <header className="border-b border-[#1E2130] pb-3">
          <p className="text-sm font-semibold">{situation?.character || (sandbox ? "Assistant" : "Interlocuteur")}</p>
          <p className="text-xs text-[#8A8FA3]">{sandbox ? "Assistant" : "Personnage joué par l'IA"}</p>
        </header>
        <div className="flex-1 space-y-3 py-4">
          {lines.map((line, index) => (
            <p
              key={`${line.from}-${index}`}
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                line.from === "candidate" ? "ml-auto bg-[#6E5BFF] text-white" : "bg-[#15171E]"
              }`}
            >
              {line.text}
            </p>
          ))}
          {moment ? (
            <div className="rounded-2xl border border-[#1E2130] p-4">
              <p className="text-xs text-[#C9C2FF]">Moment clé</p>
              <p className="mt-2 text-sm">{moment.prompt}</p>
              <div className="mt-3 space-y-2">
                {moment.choices.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => {
                      setLines((current) => [...current, { from: "candidate", text: choice }]);
                      setStep((value) => value + 1);
                    }}
                    className="block w-full rounded-2xl border border-[#1E2130] px-3 py-2 text-left text-sm"
                  >
                    {choice}
                  </button>
                ))}
              </div>
              {moment.requiresJustification ? (
                <label className="mt-3 block text-sm">
                  Pourquoi avez-vous répondu ainsi ?
                  <textarea value={why} onChange={(event) => setWhy(event.target.value)} rows={3} className="mt-2 w-full rounded-2xl border border-[#1E2130] bg-[#0B0C10] p-3" />
                </label>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex gap-2 border-t border-[#1E2130] pt-3">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") push(draft);
            }}
            placeholder="Votre réponse"
            className="flex-1 rounded-full border border-[#1E2130] bg-[#15171E] px-4 py-2 text-sm outline-none"
          />
          <PassageButton onClick={() => push(draft)}>Envoyer</PassageButton>
        </div>
        <div className="mt-3">
          <PassageButton
            onClick={() =>
              onSubmit(
                lines.map((line) => `${line.from === "candidate" ? "Vous" : "Interlocuteur"} : ${line.text}`).join("\n") +
                  (why ? `\n\nJustification : ${why}` : ""),
              )
            }
          >
            Terminer l&apos;échange
          </PassageButton>
        </div>
      </section>
      <aside className="border-t border-[#1E2130] px-4 py-4 lg:border-l lg:border-t-0">
        <p className="text-sm font-semibold">Votre objectif</p>
        <p className="mt-2 text-sm text-[#B4B8C8]">{situation?.objective || activity?.learnerPrompt || "Mener l'échange jusqu'au bout."}</p>
        <p className="mt-4 text-xs text-[#8A8FA3]">Pas de retour pendant l&apos;échange.</p>
        {sandbox ? <p className="mt-3 text-xs text-[#8A8FA3]">{activity?.maxAttempts ?? 2} essais</p> : null}
      </aside>
    </div>
  );
}
