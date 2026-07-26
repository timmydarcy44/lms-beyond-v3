"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getJessicaQuestionnaire } from "@/lib/jessica-contentin/questionnaires";
import type { JessicaQuestionnaireResponseRow } from "@/lib/queries/jessica-questionnaires";
import { JessicaSendQuestionnaireDialog } from "@/components/jessica-contentin/jessica-send-questionnaire-dialog";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import { cn } from "@/lib/utils";

type Props = {
  responses: JessicaQuestionnaireResponseRow[];
  contactId?: string;
  contactEmail?: string | null;
  contactFirstName?: string | null;
  contactLastName?: string | null;
  profileId?: string | null;
  patientId?: string | null;
  availableQuestionnaires?: { slug: string; title: string }[];
};

export function JessicaClientQuestionnairesPanel({
  responses,
  contactId,
  contactEmail,
  contactFirstName,
  contactLastName,
  profileId,
  patientId,
  availableQuestionnaires = [],
}: Props) {
  const [sendOpen, setSendOpen] = useState(false);
  const bySlug = new Map<string, JessicaQuestionnaireResponseRow[]>();
  for (const row of responses) {
    const list = bySlug.get(row.questionnaire_slug) ?? [];
    list.push(row);
    bySlug.set(row.questionnaire_slug, list);
  }

  const options =
    availableQuestionnaires.length > 0
      ? availableQuestionnaires
      : [...bySlug.keys()].map((slug) => ({
          slug,
          title: getJessicaQuestionnaire(slug)?.title ?? slug,
        }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold text-black">
          <ClipboardList className="h-4 w-4" />
          Tests & questionnaires ({responses.length})
        </h3>
        <div className="flex flex-wrap gap-3">
          {contactEmail && options.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setSendOpen(true)}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" />
              Envoyer un test
            </Button>
          ) : null}
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
      </div>

      {responses.length === 0 ? (
        <div className={cn(jessicaSuper.card, "p-5 text-sm text-neutral-500")}>
          Aucun questionnaire associé pour l’instant. Envoyez un test au client ou importez les
          réponses Typeform.
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
                      {row.source === "typeform_import"
                        ? " · import Typeform"
                        : row.source === "invite"
                          ? " · lien envoyé"
                          : ` · ${row.source}`}
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

      {contactEmail && options.length > 0 ? (
        <JessicaSendQuestionnaireDialog
          open={sendOpen}
          onOpenChange={setSendOpen}
          questionnaires={options}
          contact={{
            email: contactEmail,
            firstName: contactFirstName,
            lastName: contactLastName,
            profileId,
            patientId,
          }}
        />
      ) : null}
    </div>
  );
}
