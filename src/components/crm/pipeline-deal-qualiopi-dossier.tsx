"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseFetchJson } from "@/lib/api/parse-fetch-json";
import {
  formatSignedAt,
  qualiopiKindLabel,
  qualiopiSessionStatusLabel,
  type QualiopiSession,
} from "@/lib/crm/qualiopi-shared";

export function PipelineDealQualiopiDossier({
  dealId,
  tone = "light",
}: {
  dealId?: string;
  tone?: "light" | "dark";
}) {
  const [sessions, setSessions] = useState<QualiopiSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/crm/qualiopi/sessions?deal_id=${dealId}`);
      const json = await parseFetchJson<{ sessions?: QualiopiSession[]; error?: string }>(res);
      if (!res.ok) throw new Error(json.error);
      setSessions(json.sessions ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Dossier Qualiopi indisponible");
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    void load();
  }, [load]);

  const newFormation = async () => {
    if (!dealId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deal_id: dealId }),
      });
      const json = await parseFetchJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(json.error);
      toast.success("Nouvelle formation créée — à programmer dans l’onglet Formations");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Création impossible");
    } finally {
      setCreating(false);
    }
  };

  const dark = tone === "dark";

  if (!dealId) {
    return (
      <p className={cn("text-sm", dark ? "text-slate-400" : "text-gray-500")}>
        Enregistrez la fiche pour constituer le dossier Qualiopi.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={cn("text-sm font-semibold", dark ? "text-white" : "text-gray-900")}>
            Dossier Qualiopi
          </p>
          <p className={cn("mt-1 text-xs", dark ? "text-slate-400" : "text-gray-500")}>
            Chaque formation a sa convention, son livret, son émargement et son questionnaire.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={dark ? "border-white/25 bg-white/10 text-white hover:bg-white/20" : ""}
          disabled={creating}
          onClick={() => void newFormation()}
        >
          <Plus className="mr-1 h-3 w-3" />
          Nouvelle formation
        </Button>
      </div>

      {loading ? (
        <p className={cn("text-sm", dark ? "text-slate-400" : "text-gray-500")}>Chargement…</p>
      ) : sessions.length === 0 ? (
        <p className={cn("text-sm", dark ? "text-slate-400" : "text-gray-500")}>
          Aucune formation tant que la proposition n’est pas signée.
        </p>
      ) : (
        sessions.map((session) => (
          <article
            key={session.id}
            className={cn(
              "rounded-xl border p-4",
              dark ? "border-white/10 bg-slate-900/50" : "border-gray-200 bg-gray-50"
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className={cn("font-medium", dark ? "text-white" : "text-gray-900")}>
                  {session.course_name}
                </p>
                <p className={cn("mt-0.5 text-xs", dark ? "text-slate-400" : "text-gray-500")}>
                  {qualiopiSessionStatusLabel(session.status)}
                  {session.scheduled_at
                    ? ` · ${new Date(session.scheduled_at).toLocaleDateString("fr-FR")}`
                    : ""}
                </p>
              </div>
            </div>
            <ul className={cn("mt-3 space-y-1 text-xs", dark ? "text-slate-300" : "text-gray-700")}>
              <li>Convention : {formatSignedAt(session.convention_sent_at)?.label ?? "non envoyée"}</li>
              <li>Règlement : {formatSignedAt(session.reglement_sent_at)?.label ?? "non envoyé"}</li>
              <li>Livret : {formatSignedAt(session.livret_sent_at)?.label ?? "non envoyé"}</li>
              <li>Émargement : {formatSignedAt(session.emargement_sent_at)?.label ?? "non envoyé"}</li>
              <li>
                Satisfaction : {formatSignedAt(session.satisfaction_sent_at)?.label ?? "non envoyée"}
              </li>
            </ul>
            {(session.documents ?? []).length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {(session.documents ?? []).map((doc) =>
                  doc.file_url ? (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px]",
                        dark ? "border-white/20 text-slate-200" : "border-gray-300 text-gray-700"
                      )}
                    >
                      {qualiopiKindLabel(doc.kind)}
                    </a>
                  ) : null
                )}
              </div>
            ) : null}
            <ul className="mt-3 space-y-1 text-sm">
              {(session.attendees ?? []).map((attendee) => {
                const signed = formatSignedAt(attendee.signed_at);
                return (
                  <li key={attendee.id} className={dark ? "text-slate-200" : "text-gray-800"}>
                    {attendee.full_name}{" "}
                    <span className={dark ? "text-slate-400" : "text-gray-500"}>({attendee.email})</span>
                    <span className="block text-xs">
                      {signed ? `Émargé ${signed.label}` : "Émargement en attente"}
                      {attendee.satisfaction_score
                        ? ` · Satisfaction ${attendee.satisfaction_score}/5`
                        : attendee.satisfaction_at
                          ? " · Satisfaction reçue"
                          : ""}
                      {attendee.satisfaction_comment ? ` — ${attendee.satisfaction_comment}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </article>
        ))
      )}
    </div>
  );
}
