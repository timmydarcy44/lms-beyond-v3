"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PipelineBtobSubnav } from "@/components/super-admin/pipeline-btob-subnav";
import { PipelineQualiopiScheduleOverlay } from "@/components/crm/pipeline-qualiopi-schedule-overlay";
import { PipelineQualiopiStartOverlay } from "@/components/crm/pipeline-qualiopi-start-overlay";
import { parseFetchJson } from "@/lib/api/parse-fetch-json";
import {
  QUALIOPI_FORMATION_STAGES,
  formatSignedAt,
  type QualiopiSession,
  type QualiopiSessionStatus,
} from "@/lib/crm/qualiopi-shared";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CrmFormationsPage() {
  const [sessions, setSessions] = useState<QualiopiSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [programSession, setProgramSession] = useState<QualiopiSession | null>(null);
  const [startSession, setStartSession] = useState<QualiopiSession | null>(null);
  const [completeSession, setCompleteSession] = useState<QualiopiSession | null>(null);
  const [detail, setDetail] = useState<QualiopiSession | null>(null);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/qualiopi/sessions");
      const json = await parseFetchJson<{ sessions?: QualiopiSession[]; error?: string }>(res);
      if (!res.ok) throw new Error(json.error);
      setSessions(json.sessions ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const byStage = useMemo(() => {
    const map = new Map<QualiopiSessionStatus, QualiopiSession[]>();
    for (const stage of QUALIOPI_FORMATION_STAGES) map.set(stage.slug, []);
    for (const session of sessions) {
      const list = map.get(session.status) ?? [];
      list.push(session);
      map.set(session.status, list);
    }
    return map;
  }, [sessions]);

  const moveSession = async (session: QualiopiSession, target: QualiopiSessionStatus) => {
    if (session.status === target) return;
    if (target === "scheduled") {
      setProgramSession(session);
      return;
    }
    if (target === "in_progress") {
      if (!(session.attendees ?? []).length) {
        setProgramSession(session);
        toast.error("Intégrez d'abord les collaborateurs invités.");
        return;
      }
      setStartSession(session);
      return;
    }
    if (target === "done") {
      setCompleteSession(session);
    }
  };

  const newFormation = async (session: QualiopiSession) => {
    const res = await fetch("/api/super-admin/crm/qualiopi/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deal_id: session.deal_id }),
    });
    const json = await parseFetchJson<{ session?: QualiopiSession; error?: string }>(res);
    if (!res.ok) {
      toast.error(json.error ?? "Impossible de créer la formation");
      return;
    }
    toast.success("Nouvelle formation créée");
    await load();
    if (json.session) {
      setProgramSession({
        ...json.session,
        company_name: session.company_name,
        contact_email: session.contact_email,
        quoted_course_ids: session.quoted_course_ids,
      });
    }
  };

  const confirmComplete = async () => {
    if (!completeSession) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/super-admin/crm/qualiopi/sessions/${completeSession.id}/complete`, {
        method: "POST",
      });
      const json = await parseFetchJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(json.error);
      toast.success("Questionnaire de satisfaction envoyé");
      setCompleteSession(null);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-6 px-3 py-6 sm:px-6 sm:py-8">
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">CRM / Formations</p>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Formations</h1>
        <p className="max-w-3xl text-sm text-gray-600">
          Dès qu’une proposition est signée dans le pipe, le client arrive ici. Chaque formation a son propre
          dossier Qualiopi (convention, règlement, livret, émargement, satisfaction).
        </p>
        <PipelineBtobSubnav />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {QUALIOPI_FORMATION_STAGES.map((stage) => (
            <div
              key={stage.slug}
              className="w-[320px] shrink-0 rounded-2xl border border-gray-200 bg-gray-50 p-3"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData("sessionId");
                const session = sessions.find((item) => item.id === id);
                if (session) void moveSession(session, stage.slug);
              }}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-gray-900">{stage.label}</h2>
                <span className="text-xs text-gray-500">{byStage.get(stage.slug)?.length ?? 0}</span>
              </div>
              <div className="space-y-2">
                {(byStage.get(stage.slug) ?? []).map((session) => (
                  <article
                    key={session.id}
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("sessionId", session.id)}
                    className="cursor-pointer rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                    onClick={() => setDetail(session)}
                  >
                    <div className="font-semibold text-gray-900">{session.company_name}</div>
                    <div className="mt-1 text-sm text-gray-600">{session.course_name}</div>
                    <div className="mt-2 text-xs text-gray-500">
                      {(session.attendees ?? []).length} collaborateur
                      {(session.attendees ?? []).length > 1 ? "s" : ""}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          void newFormation(session);
                        }}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Nouvelle formation
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <PipelineQualiopiScheduleOverlay
        open={Boolean(programSession)}
        onOpenChange={(open) => {
          if (!open) setProgramSession(null);
        }}
        deal={
          programSession
            ? {
                id: programSession.id,
                company_name: programSession.company_name ?? "Client",
                email: programSession.contact_email,
                quoted_course_ids: programSession.quoted_course_ids,
              }
            : null
        }
        onDone={load}
      />
      <PipelineQualiopiStartOverlay
        open={Boolean(startSession)}
        onOpenChange={(open) => {
          if (!open) setStartSession(null);
        }}
        deal={
          startSession
            ? { id: startSession.id, company_name: startSession.company_name ?? "Client" }
            : null
        }
        onDone={load}
      />

      <Dialog open={Boolean(completeSession)} onOpenChange={(open) => !open && setCompleteSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Formation terminée — {completeSession?.company_name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Envoi automatique du questionnaire de satisfaction à chaque collaborateur. Les réponses sont stockées
            dans le dossier Qualiopi de la fiche client.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteSession(null)}>
              Annuler
            </Button>
            <Button onClick={() => void confirmComplete()} disabled={completing}>
              Envoyer le questionnaire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detail?.company_name} — {detail?.course_name}
            </DialogTitle>
          </DialogHeader>
          {detail ? (
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500">Envois Qualiopi</div>
                <ul className="mt-2 space-y-1 text-gray-700">
                  <li>Convention : {detail.convention_sent_at ? formatSignedAt(detail.convention_sent_at)?.label : "—"}</li>
                  <li>Règlement : {detail.reglement_sent_at ? formatSignedAt(detail.reglement_sent_at)?.label : "—"}</li>
                  <li>Livret : {detail.livret_sent_at ? formatSignedAt(detail.livret_sent_at)?.label : "—"}</li>
                  <li>Émargement : {detail.emargement_sent_at ? formatSignedAt(detail.emargement_sent_at)?.label : "—"}</li>
                  <li>
                    Satisfaction :{" "}
                    {detail.satisfaction_sent_at ? formatSignedAt(detail.satisfaction_sent_at)?.label : "—"}
                  </li>
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-gray-500">Collaborateurs</div>
                <ul className="mt-2 space-y-1">
                  {(detail.attendees ?? []).map((attendee) => (
                    <li key={attendee.id}>
                      {attendee.full_name} ({attendee.email}) —{" "}
                      {attendee.signed_at
                        ? `émargé ${formatSignedAt(attendee.signed_at)?.label}`
                        : "émargement en attente"}
                      {attendee.satisfaction_score
                        ? ` · satisfaction ${attendee.satisfaction_score}/5`
                        : ""}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (!detail) return;
                  void newFormation(detail);
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                Nouvelle formation
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
