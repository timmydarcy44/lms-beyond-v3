"use client";

import { useState } from "react";
import { MODULE_IFRAME_SANDBOX, playgroundSubtitle, type PlaygroundActivity, type PlaygroundActivityType, type SituationMoment } from "@/lib/openbadges/playground-activity";

function fieldClass() {
  return "w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm text-[#EEF0F7] placeholder:text-[#8C94B2]";
}

const TYPES: PlaygroundActivityType[] = ["sandbox", "situation", "module"];

export function PlaygroundActivityFields({
  activity,
  criteria,
  onChange,
}: {
  activity: PlaygroundActivity;
  criteria: Array<{ id: string; label: string }>;
  onChange: (next: PlaygroundActivity) => void;
}) {
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  const importZip = async (file: File) => {
    setImporting(true);
    setError("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("version", String(activity.module?.version ?? 0));
      const response = await fetch("/api/super-admin/open-badges/playground-module", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Import impossible");
        return;
      }
      onChange({ ...activity, type: "module", module: payload.module, mode: payload.module.scoreOnly ? "training" : activity.mode });
    } catch {
      setError("Import impossible");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TYPES.map((type) => (
          <button key={type} type="button" onClick={() => onChange({ ...activity, type })} className={`rounded-full px-3 py-1 text-sm ${activity.type === type ? "bg-[#6E5BFF] text-white" : "border border-[#26304F]"}`}>
            {playgroundSubtitle(type).replace("Playground · ", "")}
          </button>
        ))}
      </div>
      {activity.type === "sandbox" ? (
        <p className="text-xs text-[#8C94B2]">Réservé aux badges dont le domaine porte sur l&apos;usage de l&apos;IA. Consigne, essais, et consigne de correction.</p>
      ) : null}
      {activity.type === "situation" ? (
        <SituationFields activity={activity} onChange={onChange} />
      ) : null}
      {activity.type === "module" ? (
        <div className="space-y-2 text-sm">
          <label className="inline-flex cursor-pointer rounded-full border border-[#26304F] px-4 py-2">
            {importing ? "Lecture du module…" : activity.module ? `${activity.module.fileName} · v${activity.module.version}` : "Importer un ZIP"}
            <input type="file" accept=".zip,application/zip" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importZip(file); }} />
          </label>
          {activity.module ? (
            <>
              <p className="text-xs text-[#8C94B2]">{activity.module.format} · {activity.module.scoreOnly ? "Ce module n'envoie que son score" : `${activity.module.objectiveIds.length} objectifs`} · iframe sandbox ({MODULE_IFRAME_SANDBOX})</p>
              {activity.module.scoreOnly ? <p className="text-xs text-[#F2C15A]">En certification, seule la validation par un expert est possible. L&apos;entraînement reste ouvert.</p> : null}
              <div className="flex gap-2">
                {(["training", "certification"] as const).map((mode) => (
                  <button key={mode} type="button" onClick={() => onChange({ ...activity, mode })} className={`rounded-full px-3 py-1 text-xs ${activity.mode === mode ? "bg-[#6E5BFF] text-white" : "border border-[#26304F]"}`}>{mode === "training" ? "Entraînement" : "Certification"}</button>
                ))}
              </div>
              {activity.module.objectiveIds.map((objectiveId) => (
                <label key={objectiveId} className="block text-xs text-[#A9B0CC]">
                  {objectiveId}
                  <select value={activity.module?.objectiveMap.find((item) => item.objectiveId === objectiveId)?.criterionId ?? ""} onChange={(event) => {
                    const objectiveMap = activity.module!.objectiveMap.filter((item) => item.objectiveId !== objectiveId);
                    if (event.target.value) objectiveMap.push({ objectiveId, criterionId: event.target.value });
                    onChange({ ...activity, module: { ...activity.module!, objectiveMap } });
                  }} className={`${fieldClass()} mt-1`}>
                    <option value="">Critère à relier</option>
                    {criteria.map((criterion) => <option key={criterion.id} value={criterion.id}>{criterion.label}</option>)}
                  </select>
                </label>
              ))}
            </>
          ) : <p className="text-xs text-[#8C94B2]">SCORM 1.2, SCORM 2004, xAPI, cmi5 ou HTML5. Le score affiché par le module est recalculé côté serveur.</p>}
          {error ? <p className="text-xs text-[#F2C15A]">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function SituationFields({ activity, onChange }: { activity: PlaygroundActivity; onChange: (next: PlaygroundActivity) => void }) {
  const situation = activity.situation ?? { character: "", objective: "", moments: [], variants: [], mode: activity.mode };
  const patch = (next: Partial<typeof situation>) => onChange({ ...activity, situation: { ...situation, ...next }, mode: next.mode ?? activity.mode });
  const moments = situation.moments;
  const setMoment = (moment: SituationMoment) => patch({ moments: moments.map((item) => item.id === moment.id ? moment : item) });
  return (
    <div className="space-y-2">
      <input value={situation.character} onChange={(event) => patch({ character: event.target.value })} placeholder="Personnage joué par l'IA" className={fieldClass()} />
      <textarea value={situation.objective} onChange={(event) => patch({ objective: event.target.value })} placeholder="Objectif de la conversation" rows={2} className={fieldClass()} />
      <div className="flex gap-2">
        {(["training", "certification"] as const).map((mode) => (
          <button key={mode} type="button" onClick={() => patch({ mode })} className={`rounded-full px-3 py-1 text-xs ${situation.mode === mode ? "bg-[#6E5BFF] text-white" : "border border-[#26304F]"}`}>{mode === "training" ? "Entraînement" : "Certification"}</button>
        ))}
      </div>
      {moments.map((moment) => (
        <div key={moment.id} className="rounded-2xl border border-[#1A2340] p-3">
          <input value={moment.prompt} onChange={(event) => setMoment({ ...moment, prompt: event.target.value })} placeholder="Moment clé" className={fieldClass()} />
          <textarea value={moment.choices.join("\n")} onChange={(event) => setMoment({ ...moment, choices: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean) })} placeholder="Choix, un par ligne. Laissez vide pour une conversation libre." rows={2} className={`${fieldClass()} mt-2`} />
          <label className="mt-2 flex items-center gap-2 text-xs text-[#A9B0CC]">
            <input type="checkbox" checked={moment.requiresJustification} onChange={(event) => setMoment({ ...moment, requiresJustification: event.target.checked })} />
            Justification demandée
          </label>
        </div>
      ))}
      <button type="button" className="text-sm text-[#B9B2FF]" onClick={() => patch({ moments: [...moments, { id: crypto.randomUUID(), prompt: "", choices: [], freeTalk: true, requiresJustification: true }] })}>+ Moment clé</button>
      <input value={situation.variants.join(", ")} onChange={(event) => patch({ variants: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} placeholder="Variantes, séparées par des virgules" className={fieldClass()} />
    </div>
  );
}
