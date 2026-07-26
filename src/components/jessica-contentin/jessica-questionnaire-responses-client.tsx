"use client";

import Link from "next/link";
import { JessicaSuperPage } from "@/components/jessica-contentin/super/jessica-super-ui";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import type { JessicaQuestionnaireDef } from "@/lib/jessica-contentin/questionnaires";
import { interpretJessicaScore } from "@/lib/jessica-contentin/questionnaires";
import type { JessicaQuestionnaireResponseRow } from "@/lib/queries/jessica-questionnaires";
import { cn } from "@/lib/utils";

type Props = {
  questionnaire: JessicaQuestionnaireDef;
  responses: JessicaQuestionnaireResponseRow[];
};

function labelFor(row: JessicaQuestionnaireResponseRow) {
  if (row.child_first_name || row.child_last_name) {
    return [row.child_first_name, row.child_last_name].filter(Boolean).join(" ");
  }
  return (
    [row.respondent_first_name, row.respondent_last_name].filter(Boolean).join(" ") ||
    row.respondent_email ||
    "Sans nom"
  );
}

export function JessicaQuestionnaireResponsesClient({ questionnaire, responses }: Props) {
  return (
    <JessicaSuperPage
      title={`Réponses — ${questionnaire.title}`}
      subtitle={`${responses.length} réponse(s)`}
      backHref="/super/jessica-tests"
      backLabel="Tests / Questionnaires"
      actions={
        <Link
          href={`/super/jessica-tests/${questionnaire.slug}`}
          className={cn(jessicaSuper.cta, "inline-flex rounded-full px-4 py-2 text-sm")}
        >
          Remplir
        </Link>
      }
    >
      <div className={cn(jessicaSuper.card, "overflow-hidden")}>
        <div className="divide-y divide-black/[0.06]">
          {responses.length === 0 ? (
            <p className="p-6 text-sm text-neutral-500">
              Aucune réponse. Importez les exports Typeform ou remplissez le questionnaire.
            </p>
          ) : (
            responses.map((row) => (
              <Link
                key={row.id}
                href={`/super/jessica-tests/${questionnaire.slug}/reponses/${row.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-neutral-50"
              >
                <div>
                  <p className="font-medium text-black">{labelFor(row)}</p>
                  <p className="text-sm text-neutral-500">
                    {row.respondent_email || "—"}
                    {row.submitted_at
                      ? ` · ${new Date(row.submitted_at).toLocaleDateString("fr-FR")}`
                      : ""}
                  </p>
                </div>
                <div className="text-right text-sm">
                  {row.score != null ? (
                    <p className="max-w-xs font-semibold text-[#8B6F47]">
                      {interpretJessicaScore(questionnaire.slug, Number(row.score))}
                    </p>
                  ) : row.score_label ? (
                    <p className="max-w-xs text-neutral-500">{row.score_label}</p>
                  ) : null}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </JessicaSuperPage>
  );
}
