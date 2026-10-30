"use client";

import { useEffect, useMemo, useState } from "react";

import { useCourseBuilder } from "@/hooks/use-course-builder";

const FORMATS = ["Présentiel", "Distanciel", "Mixte", "E-learning"];
const AUDIENCES = ["Managers", "Commerciaux", "Équipes RH", "Direction", "Nouveaux arrivants", "Tous les collaborateurs"];

function QualiopiMark() {
  return <span className="rounded-full bg-[#FFF1E2] px-2 py-0.5 text-[11px] font-bold text-[#8A4B0F]">Qualiopi</span>;
}

export function FormationFicheExtras() {
  const general = useCourseBuilder((state) => state.snapshot.general);
  const updateGeneral = useCourseBuilder((state) => state.updateGeneral);
  const [skillQuery, setSkillQuery] = useState("");
  const [catalog, setCatalog] = useState<string[]>([]);

  useEffect(() => {
    let ignore = false;
    fetch("/api/skills/catalog-extras")
      .then((response) => response.json())
      .then((data: { entries?: { name?: string }[] }) => {
        if (ignore) return;
        setCatalog((data.entries ?? []).map((entry) => String(entry.name ?? "").trim()).filter(Boolean));
      })
      .catch(() => setCatalog([]));
    return () => {
      ignore = true;
    };
  }, []);

  const competencies = general.competencies ?? [];
  const audiences = general.audiences ?? [];
  const suggestions = useMemo(() => {
    const query = skillQuery.trim().toLowerCase();
    if (query.length < 2) return [];
    return catalog.filter((name) => name.toLowerCase().includes(query) && !competencies.includes(name)).slice(0, 6);
  }, [catalog, competencies, skillQuery]);

  const addCompetency = (label: string) => {
    const next = label.trim();
    if (!next || competencies.includes(next)) return;
    updateGeneral({ competencies: [...competencies, next] });
    setSkillQuery("");
  };

  return (
    <section className="space-y-4 rounded-[28px] border border-[#E3E0D8] bg-white p-6 text-[#07080B]">
      <div>
        <h2 className="text-[22px] font-extrabold">Compléments de la fiche</h2>
        <p className="mt-1 text-sm text-[#6B6F7A]">Ces champs manquaient. Ils sont enregistrés avec la formation.</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-extrabold">Format</p>
        <div className="flex flex-wrap gap-2">
          {FORMATS.map((format) => {
            const active = general.delivery_format === format;
            return (
              <button
                key={format}
                type="button"
                aria-pressed={active}
                onClick={() => updateGeneral({ delivery_format: active ? "" : format })}
                className={`rounded-full px-4 py-2 text-sm font-bold ${active ? "bg-[#07080B] text-white" : "border border-[#E3E0D8] bg-white"}`}
              >
                {format}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-extrabold">Compétences visées</p>
        <div className="flex flex-wrap gap-2">
          {competencies.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => updateGeneral({ competencies: competencies.filter((item) => item !== skill) })}
              className="rounded-full bg-[#EEEBFF] px-3 py-1 text-sm font-bold text-[#4B3BD1]"
            >
              {skill} ×
            </button>
          ))}
        </div>
        <input
          value={skillQuery}
          onChange={(event) => setSkillQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCompetency(skillQuery);
            }
          }}
          placeholder="Ajouter une compétence, puis Entrée"
          className="h-[52px] w-full rounded-2xl border border-[#E3E0D8] px-4 text-sm outline-none focus:ring-2 focus:ring-[#6E5BFF]"
        />
        {suggestions.length ? (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((name) => (
              <button key={name} type="button" onClick={() => addCompetency(name)} className="rounded-full border border-[#E3E0D8] px-3 py-1 text-sm">
                + {name}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-extrabold">Public visé</p>
        <div className="flex flex-wrap gap-2">
          {AUDIENCES.map((audience) => {
            const active = audiences.includes(audience);
            return (
              <button
                key={audience}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  updateGeneral({
                    audiences: active ? audiences.filter((item) => item !== audience) : [...audiences, audience],
                  })
                }
                className={`rounded-full px-4 py-2 text-sm font-bold ${active ? "bg-[#07080B] text-white" : "border border-[#E3E0D8] bg-white"}`}
              >
                {audience}
              </button>
            );
          })}
        </div>
      </div>

      <label className="block space-y-2">
        <span className="flex items-center gap-2 text-sm font-extrabold">Modalités d&apos;évaluation <QualiopiMark /></span>
        <textarea
          value={general.evaluation_modalities ?? ""}
          onChange={(event) => updateGeneral({ evaluation_modalities: event.target.value })}
          placeholder="Quiz de fin de module, étude de cas, entretien..."
          className="min-h-24 w-full rounded-2xl border border-[#E3E0D8] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6E5BFF]"
        />
      </label>

      <label className="block space-y-2">
        <span className="flex items-center gap-2 text-sm font-extrabold">Accessibilité <QualiopiMark /></span>
        <textarea
          value={general.accessibility ?? ""}
          onChange={(event) => updateGeneral({ accessibility: event.target.value })}
          placeholder="Aménagements possibles, sous-titres, rythme adaptable..."
          className="min-h-24 w-full rounded-2xl border border-[#E3E0D8] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6E5BFF]"
        />
      </label>

      <label className="block space-y-2">
        <span className="flex items-center gap-2 text-sm font-extrabold">Délai d&apos;accès <QualiopiMark /></span>
        <input
          value={general.access_delay ?? ""}
          onChange={(event) => updateGeneral({ access_delay: event.target.value })}
          placeholder="Ex : 48 heures après inscription"
          className="h-[52px] w-full rounded-2xl border border-[#E3E0D8] px-4 text-sm outline-none focus:ring-2 focus:ring-[#6E5BFF]"
        />
      </label>
    </section>
  );
}
