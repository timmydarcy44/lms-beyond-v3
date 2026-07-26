"use client";

import Link from "next/link";
import { JessicaSuperPage } from "@/components/jessica-contentin/super/jessica-super-ui";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import type { JessicaQuestionnaireDef } from "@/lib/jessica-contentin/questionnaires";
import {
  getJessicaScoreBenchmark,
  interpretJessicaScore,
} from "@/lib/jessica-contentin/questionnaires";
import type { JessicaQuestionnaireResponseRow } from "@/lib/queries/jessica-questionnaires";
import { cn } from "@/lib/utils";

type Props = {
  questionnaire: JessicaQuestionnaireDef;
  response: JessicaQuestionnaireResponseRow;
};

function formatAnswer(value: unknown): string {
  if (value == null || value === "") return "—";
  if (value === true) return "Oui";
  if (value === false) return "Non";
  if (value === "1") return "Oui";
  if (value === "0") return "Non";
  return String(value);
}

export function JessicaQuestionnaireResponseDetailClient({ questionnaire, response }: Props) {
  const title =
    [response.child_first_name, response.child_last_name].filter(Boolean).join(" ") ||
    [response.respondent_first_name, response.respondent_last_name].filter(Boolean).join(" ") ||
    response.respondent_email ||
    "Réponse";

  const bench = getJessicaScoreBenchmark(questionnaire.slug);
  const interpreted =
    response.score != null
      ? interpretJessicaScore(questionnaire.slug, Number(response.score))
      : null;

  return (
    <JessicaSuperPage
      title={title}
      subtitle={questionnaire.title}
      backHref={`/super/jessica-tests/${questionnaire.slug}/reponses`}
      backLabel="Réponses"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        <div className={cn(jessicaSuper.card, "p-5 text-sm")}>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500">Email</dt>
              <dd>{response.respondent_email || "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Date</dt>
              <dd>
                {response.submitted_at
                  ? new Date(response.submitted_at).toLocaleString("fr-FR")
                  : "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-neutral-500">Score</dt>
              <dd className="font-medium text-[#8B6F47]">
                {interpreted ||
                  (response.score != null
                    ? `${response.score}${response.score_label ? ` — ${response.score_label}` : ""}`
                    : "—")}
              </dd>
              {bench ? <p className="mt-1 text-xs text-neutral-500">{bench.hint}</p> : null}
            </div>
            <div>
              <dt className="text-neutral-500">Source</dt>
              <dd>{response.source}</dd>
            </div>
          </dl>
          {(response.profile_id || response.cabinet_patient_id) && (
            <p className="mt-4">
              <Link
                href={`/super/jessica-crm/${response.profile_id || response.cabinet_patient_id}`}
                className="text-sm font-medium text-[#8B6F47] hover:underline"
              >
                Ouvrir la fiche client →
              </Link>
            </p>
          )}
        </div>

        <div className={cn(jessicaSuper.card, "divide-y divide-black/[0.06]")}>
          {questionnaire.questions.map((q, idx) => {
            const val = response.answers?.[q.id];
            if (val == null || val === "" || val === false) return null;
            return (
              <div key={q.id} className="px-5 py-4">
                <p className="text-sm font-medium text-black">
                  <span className="mr-2 text-neutral-400">{idx + 1}.</span>
                  {q.label}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                  {formatAnswer(val)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </JessicaSuperPage>
  );
}
