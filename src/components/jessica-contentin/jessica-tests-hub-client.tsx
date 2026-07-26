"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ClipboardList, Download, Eye, Loader2, Pencil, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JessicaSuperPage } from "@/components/jessica-contentin/super/jessica-super-ui";
import { JessicaSendQuestionnaireDialog } from "@/components/jessica-contentin/jessica-send-questionnaire-dialog";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import type { JessicaQuestionnaireDef } from "@/lib/jessica-contentin/questionnaires";
import { getJessicaScoreBenchmark } from "@/lib/jessica-contentin/questionnaires";
import type { SendQuestionnaireContact } from "@/components/jessica-contentin/jessica-send-questionnaire-dialog";
import { cn } from "@/lib/utils";

type Props = {
  questionnaires: (JessicaQuestionnaireDef & { id?: string })[];
  counts: Record<string, number>;
  contacts?: SendQuestionnaireContact[];
};

export function JessicaTestsHubClient({ questionnaires, counts, contacts = [] }: Props) {
  const [importing, setImporting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendSlug, setSendSlug] = useState<string | undefined>();

  const total = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts],
  );

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch("/api/admin/jessica-questionnaires/import", { method: "POST" });
      const json = (await res.json()) as {
        error?: string;
        upserted?: number;
        total?: number;
        linkedApprox?: number;
      };
      if (!res.ok) throw new Error(json.error ?? "Import impossible");
      toast.success(
        `${json.upserted ?? json.total ?? 0} réponses importées` +
          (json.linkedApprox ? ` (${json.linkedApprox} rapprochements CRM)` : ""),
      );
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import impossible");
    } finally {
      setImporting(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/jessica-questionnaires", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });
      const json = (await res.json()) as { error?: string; seeded?: number };
      if (!res.ok) throw new Error(json.error ?? "Initialisation impossible");
      toast.success(`${json.seeded ?? 0} questionnaire(s) initialisé(s)`);
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Initialisation impossible");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <JessicaSuperPage
      title="Tests / Questionnaires"
      subtitle={`${total} réponse(s) — prévisualisation Typeform, partage et envoi Resend`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/super/jessica-tests/nouveau"
            className={cn(jessicaSuper.cta, "inline-flex items-center rounded-full px-4 py-2 text-sm")}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nouveau
          </Link>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => {
              setSendSlug(undefined);
              setSendOpen(true);
            }}
          >
            <Send className="mr-2 h-4 w-4" />
            Envoyer
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={seeding}
            onClick={() => void handleSeed()}
          >
            {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Initialiser les 5 tests Typeform
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={importing}
            onClick={() => void handleImport()}
          >
            {importing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Importer réponses Typeform
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {questionnaires.map((q) => {
          const count = counts[q.slug] ?? 0;
          const bench = getJessicaScoreBenchmark(q.slug);
          return (
            <div key={q.slug} className={cn(jessicaSuper.card, "flex flex-col p-5")}>
              <div className="mb-3 flex items-start gap-3">
                <div className={jessicaSuper.iconBox}>
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-black">{q.title}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{q.description}</p>
                  <p className="mt-2 text-xs text-neutral-400">
                    {q.questions.length} questions · {count} réponse(s)
                  </p>
                  {bench ? (
                    <p className="mt-2 text-xs leading-relaxed text-[#8B6F47]">
                      {bench.hint}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <Link
                  href={`/super/jessica-tests/${q.slug}/apercu`}
                  target="_blank"
                  className={cn(jessicaSuper.cta, "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm")}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Prévisualiser
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setSendSlug(q.slug);
                    setSendOpen(true);
                  }}
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Envoyer
                </Button>
                <Link
                  href={`/super/jessica-tests/${q.slug}`}
                  className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                >
                  Remplir (admin)
                </Link>
                <Link
                  href={`/super/jessica-tests/${q.slug}/modifier`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </Link>
                <Link
                  href={`/super/jessica-tests/${q.slug}/reponses`}
                  className="inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                >
                  Réponses
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <JessicaSendQuestionnaireDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        questionnaires={questionnaires.map((q) => ({ slug: q.slug, title: q.title }))}
        defaultSlug={sendSlug}
        contacts={contacts}
      />
    </JessicaSuperPage>
  );
}
