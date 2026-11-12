"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Pencil, Sparkles } from "lucide-react";
import {
  createId,
  type TrainingProgramSection,
  type TrainingProgramSubchapterKind,
} from "@/lib/training-courses/cms-types";
import { AccountFormationRequestWizard } from "@/components/control/account-formation-request-wizard";
import {
  type SurMesureCourse,
  splitPrerequisites,
  surmesureEditHref,
} from "@/lib/training-courses/surmesure-ui";
import { buildSessionPlan } from "@/lib/training-courses/surmesure-planning";

type WizardPerson = {
  userId: string;
  name: string;
  email: string;
  invited?: boolean;
};

type OrgAddress = {
  addressLine: string | null;
  addressZip: string | null;
  addressCity: string | null;
  siret?: string | null;
};

function kindLabel(kind?: TrainingProgramSubchapterKind) {
  if (kind === "quiz") return "Quiz";
  if (kind === "experiential_interview") return "Entretien";
  return null;
}

function StructureOutline({
  sections,
  onChange,
}: {
  sections: TrainingProgramSection[];
  onChange: (next: TrainingProgramSection[]) => void;
}) {
  function addActivity(
    sectionIndex: number,
    chapterIndex: number,
    kind: "quiz" | "experiential_interview",
  ) {
    onChange(
      sections.map((section, si) => {
        if (si !== sectionIndex) return section;
        return {
          ...section,
          chapters: section.chapters.map((chapter, ci) => {
            if (ci !== chapterIndex) return chapter;
            return {
              ...chapter,
              subchapters: [
                ...chapter.subchapters,
                {
                  id: createId(),
                  title: kind === "quiz" ? "Quiz de validation" : "Entretien expérientiel",
                  kind,
                },
              ],
            };
          }),
        };
      }),
    );
  }

  function removeSubchapter(sectionIndex: number, chapterIndex: number, subIndex: number) {
    onChange(
      sections.map((section, si) => {
        if (si !== sectionIndex) return section;
        return {
          ...section,
          chapters: section.chapters.map((chapter, ci) => {
            if (ci !== chapterIndex) return chapter;
            return {
              ...chapter,
              subchapters: chapter.subchapters.filter((_, i) => i !== subIndex),
            };
          }),
        };
      }),
    );
  }

  if (!sections.length) {
    return (
      <p className="rounded-2xl border border-dashed border-[#26304F] px-4 py-8 text-center text-sm text-[#8A93AE]">
        Structure non générée. Lancez Byound AI pour proposer sections, chapitres et sous-chapitres.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#8A93AE]">
        Structure seule — pas d’édition de contenu. Ajoutez un quiz ou un entretien si besoin.
      </p>
      {sections.map((section, si) => (
        <div key={section.id} className="rounded-2xl border border-[#26304F] bg-[#111831] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4B8FF]">
            Section {si + 1}
          </p>
          <h4 className="mt-1 text-sm font-extrabold text-white">{section.title}</h4>
          {section.description ? (
            <p className="mt-1 text-xs text-[#8A93AE]">{section.description}</p>
          ) : null}
          <div className="mt-3 space-y-3">
            {section.chapters.map((chapter, ci) => (
              <div key={chapter.id} className="rounded-xl border border-[#1A2340] bg-[#0B1122] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A93AE]">
                  Chapitre {ci + 1}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#E8ECF8]">{chapter.title}</p>
                <ul className="mt-2 space-y-1.5">
                  {chapter.subchapters.map((sub, subi) => {
                    const label = kindLabel(sub.kind);
                    return (
                      <li
                        key={sub.id}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-[#C9D2E8]"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="text-[#5A6480]">↳</span>
                          <span className="truncate">{sub.title}</span>
                          {label ? (
                            <span className="shrink-0 rounded-full bg-[#241C3E] px-2 py-0.5 text-[10px] font-semibold text-[#C4B8FF]">
                              {label}
                            </span>
                          ) : null}
                        </span>
                        {sub.kind === "quiz" || sub.kind === "experiential_interview" ? (
                          <button
                            type="button"
                            className="shrink-0 text-[#FF8A9B] hover:underline"
                            onClick={() => removeSubchapter(si, ci, subi)}
                          >
                            Retirer
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[#26304F] px-2.5 py-1 text-[11px] font-semibold text-[#C9D2E8]"
                    onClick={() => addActivity(si, ci, "quiz")}
                  >
                    + Quiz
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[#26304F] px-2.5 py-1 text-[11px] font-semibold text-[#C9D2E8]"
                    onClick={() => addActivity(si, ci, "experiential_interview")}
                  >
                    + Entretien
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PillList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-[#8A93AE]">—</p>;
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-2xl border border-[#1A2340] bg-[#0B1122] px-3 py-2 text-sm text-[#E8ECF8]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function AccountSurMesurePresentation({
  organizationId,
  organizationName,
  initialCourse,
  people = [],
  contactEmail = null,
  contactName = null,
  orgAddress = null,
}: {
  organizationId: string;
  organizationName: string;
  initialCourse: SurMesureCourse;
  people?: WizardPerson[];
  contactEmail?: string | null;
  contactName?: string | null;
  orgAddress?: OrgAddress | null;
}) {
  const router = useRouter();
  const [course, setCourse] = useState(initialCourse);
  const [structure, setStructure] = useState<TrainingProgramSection[]>(
    initialCourse.program_structure ?? [],
  );
  const [generating, setGenerating] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const prerequisites = splitPrerequisites(course.prerequisites).filter(Boolean);
  const sectionsCount = structure.length;
  const chaptersCount = structure.reduce((n, s) => n + s.chapters.length, 0);
  const subchaptersCount = structure.reduce(
    (n, s) => n + s.chapters.reduce((m, c) => m + c.subchapters.length, 0),
    0,
  );
  const sessionPlan = useMemo(
    () => buildSessionPlan(structure, course.duration),
    [structure, course.duration],
  );

  async function persistStructure(next: TrainingProgramSection[]) {
    setStructure(next);
    try {
      const res = await fetch(
        `/api/super/comptes-clients/${organizationId}/surmesure/${course.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ program_structure: next }),
        },
      );
      const json = (await res.json()) as { course?: SurMesureCourse; error?: string };
      if (!res.ok || !json.course) throw new Error(json.error || "Maj structure impossible");
      setCourse(json.course);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Maj structure impossible");
    }
  }

  async function regenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/super/comptes-clients/${organizationId}/surmesure/${course.id}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      const json = (await res.json()) as {
        course?: SurMesureCourse;
        program_structure?: TrainingProgramSection[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Génération impossible");
      const next = json.program_structure ?? json.course?.program_structure ?? [];
      setStructure(next);
      if (json.course) setCourse(json.course);
      setNotice("Structure régénérée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Génération impossible");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="overflow-hidden rounded-[32px] border border-[#6E5BFF]/35 bg-gradient-to-br from-[#1A1440] via-[#111831] to-[#0A0F1E] p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#C4B8FF]">
          Sur-mesure · {organizationName}
        </p>
        <h1 className="mt-3 max-w-3xl text-[34px] font-extrabold tracking-[-1px] text-white">
          {course.title}
        </h1>
        {course.short_description ? (
          <p className="mt-3 max-w-2xl text-base text-[#C9D2E8]">{course.short_description}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          {[
            course.duration,
            course.level,
            course.domain,
            sectionsCount ? `${sectionsCount} sections` : null,
            chaptersCount ? `${chaptersCount} chapitres` : null,
            subchaptersCount ? `${subchaptersCount} sous-chapitres` : null,
          ]
            .filter(Boolean)
            .map((item) => (
              <span key={String(item)} className="rounded-full bg-white/10 px-3 py-1 text-[#E8ECF8]">
                {item}
              </span>
            ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setQuoteOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white"
          >
            <FileText className="h-4 w-4" /> Créer un devis
          </button>
          <Link
            href={surmesureEditHref(organizationId, course.id)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#0A0F1E]"
          >
            <Pencil className="h-4 w-4" /> Modifier la fiche
          </Link>
          <button
            type="button"
            disabled={generating}
            onClick={() => void regenerate()}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {structure.length ? "Régénérer la structure" : "Créer avec Byound AI"}
          </button>
        </div>
        <p className="mt-3 max-w-xl text-xs text-[#8A93AE]">
          Le devis Sur-mesure n’est pas figé ici : le tarif dépend des formateurs selon les
          compétences à animer. Le CTA ouvre une demande de dossier à finaliser ensuite.
        </p>
      </header>

      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}
      {notice ? <p className="text-sm text-[#6BE39B]">{notice}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#C4B8FF]">
            Objectifs pédagogiques
          </h2>
          <div className="mt-3">
            <PillList items={course.objectives ?? []} />
          </div>
        </section>
        <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#C4B8FF]">
            Prérequis
          </h2>
          <div className="mt-3">
            <PillList items={prerequisites} />
          </div>
        </section>
        <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#C4B8FF]">
            Compétences
          </h2>
          <div className="mt-3">
            <PillList items={course.skills ?? []} />
          </div>
        </section>
        <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#C4B8FF]">
            Public & besoins
          </h2>
          <div className="mt-3 space-y-3">
            <PillList items={course.audience ?? []} />
            {course.specific_needs ? (
              <p className="rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm text-[#C9D2E8]">
                {course.specific_needs}
              </p>
            ) : null}
          </div>
        </section>
      </div>

      {(course.intra_price != null || course.inter_price != null) && (
        <section className="rounded-[28px] border border-[#1A2340] bg-[#111831] p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-[#8A93AE]">Tarifs</h2>
          <p className="mt-2 text-sm text-[#E8ECF8]">
            {[
              course.intra_price != null ? `${course.intra_price} € HT intra` : null,
              course.inter_price != null ? `${course.inter_price} € HT inter` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </section>
      )}

      {structure.length > 0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-extrabold">Planning pédagogique</h2>
            <p className="mt-1 text-sm text-[#8A93AE]">
              Répartition automatique des sections sur Matinée / Après-midi selon la durée (
              {course.duration || "—"}).
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {sessionPlan.map((slot) => (
              <article
                key={slot.label}
                className="rounded-[24px] border border-[#26304F] bg-[#111831] p-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4B8FF]">
                  {slot.label}
                </p>
                {slot.sections.length === 0 ? (
                  <p className="mt-2 text-sm text-[#8A93AE]">Aucune section assignée</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {slot.sections.map((section, localIdx) => {
                      const globalIndex = slot.sectionIndexes[localIdx] ?? localIdx;
                      return (
                        <li
                          key={section.id}
                          className="rounded-xl border border-[#1A2340] bg-[#0B1122] px-3 py-2"
                        >
                          <p className="text-xs text-[#8A93AE]">Section {globalIndex + 1}</p>
                          <p className="text-sm font-semibold text-white">{section.title}</p>
                          <p className="mt-0.5 text-[11px] text-[#8A93AE]">
                            {section.chapters.length} chapitre(s) ·{" "}
                            {section.chapters.reduce((n, c) => n + c.subchapters.length, 0)}{" "}
                            sous-chapitre(s)
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">Programme détaillé</h2>
        <StructureOutline sections={structure} onChange={(next) => void persistStructure(next)} />
      </section>

      {quoteOpen ? (
        <AccountFormationRequestWizard
          orgId={organizationId}
          orgName={organizationName}
          contactEmail={contactEmail}
          contactName={contactName}
          orgAddress={orgAddress}
          people={people}
          initialCourseId={course.id}
          quoteMode="surmesure"
          onClose={() => setQuoteOpen(false)}
          onDone={(message) => {
            setNotice(message);
            setQuoteOpen(false);
            router.push(`/super/organisations/${organizationId}?tab=dossiers`);
          }}
        />
      ) : null}
    </div>
  );
}
