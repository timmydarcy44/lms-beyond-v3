"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { getJessicaQuestionnaire } from "@/lib/jessica-contentin/questionnaires";
import type { JessicaQuestionnaireResponseRow } from "@/lib/queries/jessica-questionnaires";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import { cn } from "@/lib/utils";

type Props = {
  responses: JessicaQuestionnaireResponseRow[];
  /** Pour préremplir le fill form */
  contactId?: string;
};

export function JessicaClientQuestionnairesPanel({ responses, contactId }: Props) {
  const bySlug = new Map<string, JessicaQuestionnaireResponseRow[]>();
  for (const row of responses) {
    const list = bySlug.get(row.questionnaire_slug) ?? [];
    list.push(row);
    bySlug.set(row.questionnaire_slug, list);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold text-black">
          <ClipboardList className="h-4 w-4" />
          Tests & questionnaires ({responses.length})
        </h3>
        <Link
          href={
            contactId
              ? `/super/jessica-tests?contact=${encodeURIComponent(contactId)}`
              : "/super/jessica-tests"
          }
          className="text-sm font-medium text-[#8B6F47] hover:underline"
        >
          Voir tous les tests →
        </Link>
      </div>

      {responses.length === 0 ? (
        <div className={cn(jessicaSuper.card, "p-5 text-sm text-neutral-500")}>
          Aucun questionnaire associé pour l’instant. Importez les exports Typeform ou remplissez un
          test depuis l’onglet Tests / Questionnaires.
        </div>
      ) : (
        [...bySlug.entries()].map(([slug, rows]) => {
          const def = getJessicaQuestionnaire(slug);
          return (
            <div key={slug} className={cn(jessicaSuper.card, "overflow-hidden")}>
              <div className="border-b border-black/[0.06] px-5 py-3">
                <p className="font-semibold text-black">{def?.title ?? slug}</p>
              </div>
              <div className="divide-y divide-black/[0.06]">
                {rows.map((row) => (
                  <Link
                    key={row.id}
                    href={`/super/jessica-tests/${slug}/reponses/${row.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm hover:bg-neutral-50"
                  >
                    <span>
                      {row.submitted_at
                        ? new Date(row.submitted_at).toLocaleDateString("fr-FR")
                        : "Sans date"}
                      {row.source === "typeform_import" ? " · import Typeform" : " · CRM"}
                    </span>
                    <span className="font-medium text-[#8B6F47]">
                      {row.score != null ? `Score ${row.score}` : "Voir les réponses"}
                      {row.score_label ? ` — ${row.score_label}` : ""}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
