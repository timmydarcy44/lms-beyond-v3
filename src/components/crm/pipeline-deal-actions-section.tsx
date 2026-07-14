"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2, Mic, MicOff, PenLine, Phone, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PIPELINE_ACTION_TYPES,
  pipelineActionLabel,
  isCallActionType,
  type PipelineActionType,
} from "@/lib/crm/pipeline-deal-action-types";
import { pipelineOwnerLabel } from "@/lib/crm/pipeline-btob-owners";

export type PipelineDealAction = {
  id: string;
  action_type: string;
  title?: string | null;
  notes?: string | null;
  transcript?: string | null;
  ai_summary?: string | null;
  created_at: string;
  created_by_email?: string | null;
};

type OverlayMode = "choose" | "dictate" | "write";

function formatActionWhen(iso: string): string {
  try {
    return format(new Date(iso), "d MMM yyyy · HH:mm", { locale: fr });
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

function formatRecordingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function actionMeta(type: string) {
  return PIPELINE_ACTION_TYPES.find((t) => t.value === type);
}

export function PipelineDealActionsSection({
  dealId,
  phone,
  companyName,
  contactFirstName,
  contactLastName,
  currentUserEmail,
  onActionsChange,
}: {
  dealId?: string;
  phone?: string | null;
  companyName: string;
  contactFirstName: string;
  contactLastName?: string;
  currentUserEmail: string | null;
  onActionsChange?: () => void;
}) {
  const [actions, setActions] = useState<PipelineDealAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [draftType, setDraftType] = useState<PipelineActionType>("call_success");
  const [draftNotes, setDraftNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [postCallOverlayOpen, setPostCallOverlayOpen] = useState(false);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>("choose");
  const [callActive, setCallActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const callPendingRef = useRef(false);
  const leftPageRef = useRef(false);
  const dictateAutoStartedRef = useRef(false);

  const displayContact =
    [contactFirstName, contactLastName].filter(Boolean).join(" ").trim() || companyName;

  const load = useCallback(async () => {
    if (!dealId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/crm/pipeline/deals/${dealId}/actions`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setActions(json.actions ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement actions impossible");
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetRecordingState = useCallback(() => {
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setRecording(false);
    setHasRecording(false);
    setRecordingSeconds(0);
    dictateAutoStartedRef.current = false;
  }, []);

  const finishCallFlow = useCallback(() => {
    callPendingRef.current = false;
    leftPageRef.current = false;
    setCallActive(false);
    setPostCallOverlayOpen(false);
    setOverlayMode("choose");
    resetRecordingState();
  }, [resetRecordingState]);

  const openPostCallOverlay = useCallback(() => {
    setPostCallOverlayOpen(true);
    setOverlayMode("choose");
    setAddOpen(false);
  }, []);

  useEffect(() => {
    if (!callActive) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") leftPageRef.current = true;
      else if (callPendingRef.current && leftPageRef.current) openPostCallOverlay();
    };
    const onFocus = () => {
      if (callPendingRef.current && leftPageRef.current) openPostCallOverlay();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [callActive, openPostCallOverlay]);

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [recording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setHasRecording(chunksRef.current.length > 0);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordingSeconds(0);
      setHasRecording(false);
    } catch {
      toast.error("Microphone inaccessible.");
    }
  }, []);

  useEffect(() => {
    if (
      postCallOverlayOpen &&
      overlayMode === "dictate" &&
      !dictateAutoStartedRef.current &&
      !recording &&
      !hasRecording
    ) {
      dictateAutoStartedRef.current = true;
      void startRecording();
    }
  }, [postCallOverlayOpen, overlayMode, recording, hasRecording, startRecording]);

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const startCall = () => {
    if (!phone?.trim()) {
      toast.error("Ajoutez un numéro de téléphone sur la fiche.");
      return;
    }
    callPendingRef.current = true;
    leftPageRef.current = false;
    setCallActive(true);
    window.location.href = `tel:${phone.replace(/\s/g, "")}`;
  };

  const createAction = async (opts: {
    actionType: PipelineActionType;
    notes?: string;
    withAi?: boolean;
  }) => {
    if (!dealId) {
      toast.error("Enregistrez la fiche avant d'ajouter une action.");
      return false;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/super-admin/crm/pipeline/deals/${dealId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_type: opts.actionType,
          notes: opts.notes?.trim() || null,
          with_ai_summary: opts.withAi === true,
          created_by_email: currentUserEmail,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await load();
      onActionsChange?.();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const submitDraft = async (withAi: boolean) => {
    const ok = await createAction({
      actionType: draftType,
      notes: draftNotes,
      withAi,
    });
    if (!ok) return;
    setAddOpen(false);
    setDraftNotes("");
    toast.success(withAi ? "Action enregistrée avec synthèse IA" : "Action enregistrée");
  };

  const submitPostCallNotes = async (withAi: boolean) => {
    if (!draftNotes.trim() && withAi) {
      toast.error("Ajoutez un compte-rendu ou choisissez « Dicter ».");
      return;
    }
    const ok = await createAction({
      actionType: draftType,
      notes: draftNotes,
      withAi,
    });
    if (!ok) return;
    setDraftNotes("");
    finishCallFlow();
    toast.success(withAi ? "Synthèse IA enregistrée" : "Action enregistrée");
  };

  const submitAudio = async () => {
    if (!dealId) return;
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    if (blob.size < 1000) {
      toast.error("Enregistrement audio trop court.");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("audio", blob, "call.webm");
      form.append("action_type", draftType);
      if (draftNotes.trim()) form.append("notes", draftNotes.trim());
      if (currentUserEmail) form.append("created_by_email", currentUserEmail);

      const res = await fetch(
        `/api/super-admin/crm/pipeline/deals/${dealId}/actions/transcribe`,
        { method: "POST", body: form },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDraftNotes("");
      finishCallFlow();
      await load();
      onActionsChange?.();
      toast.success("Appel transcrit et synthétisé par l'IA");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Transcription impossible");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickType = (type: PipelineActionType) => {
    setDraftType(type);
    if (type === "call_success" && phone?.trim()) {
      startCall();
    }
  };

  if (!dealId) {
    return (
      <section className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
        Enregistrez la fiche pour journaliser les actions commerciales.
      </section>
    );
  }

  return (
    <>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900">Actions</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            onClick={() => {
              setDraftType("call_success");
              setDraftNotes("");
              setAddOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>

        {callActive && !postCallOverlayOpen ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-sm text-indigo-900">
            <span>Appel avec {displayContact}</span>
            <Button type="button" size="sm" variant="secondary" onClick={openPostCallOverlay}>
              Résumer
            </Button>
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : actions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
            Aucune action consignée. Cliquez sur + pour journaliser un appel, un email ou une note.
          </p>
        ) : (
          <ul className="space-y-2">
            {actions.map((a) => {
              const meta = actionMeta(a.action_type);
              return (
                <li
                  key={a.id}
                  className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span aria-hidden>{meta?.icon ?? "•"}</span>
                        {pipelineActionLabel(a.action_type)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatActionWhen(a.created_at)}
                        {a.created_by_email
                          ? ` · ${pipelineOwnerLabel(a.created_by_email)}`
                          : null}
                      </p>
                    </div>
                  </div>
                  {a.ai_summary ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{a.ai_summary}</p>
                  ) : a.notes ? (
                    <p className="mt-2 text-sm text-gray-600">{a.notes}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Ajouter une action */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="gap-4 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle action</DialogTitle>
            <DialogDescription>
              Choisissez le type — date, heure et auteur seront enregistrés automatiquement.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            {PIPELINE_ACTION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                  draftType === t.value
                    ? "border-indigo-600 bg-indigo-50 font-medium text-indigo-900"
                    : "border-gray-200 hover:border-indigo-300"
                }`}
                onClick={() => handlePickType(t.value)}
              >
                <span className="mr-1.5">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {isCallActionType(draftType) && phone?.trim() ? (
            <Button type="button" variant="outline" size="sm" onClick={startCall}>
              <Phone className="mr-2 h-4 w-4" />
              Appeler {displayContact}
            </Button>
          ) : null}

          <div className="space-y-2">
            <Label>Détails (optionnel)</Label>
            <Textarea
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              rows={3}
              placeholder="Compte-rendu, objections, prochaine étape…"
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => void submitDraft(false)}
            >
              Enregistrer
            </Button>
            <Button type="button" disabled={submitting} onClick={() => void submitDraft(true)}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Synthèse IA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post-appel */}
      <Dialog
        open={postCallOverlayOpen}
        onOpenChange={(open) => {
          if (!open) {
            if (recording) stopRecording();
            resetRecordingState();
            setPostCallOverlayOpen(false);
            setOverlayMode("choose");
          }
        }}
      >
        <DialogContent className="gap-5 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Maintenant, résumons l&apos;appel</DialogTitle>
            <DialogDescription>
              Avec {displayContact} — dictez ou écrivez ce qui s&apos;est passé.
            </DialogDescription>
          </DialogHeader>

          {overlayMode === "choose" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-indigo-100 bg-indigo-50/80 p-5 text-center transition hover:border-indigo-400"
                onClick={() => setOverlayMode("dictate")}
              >
                <Mic className="h-8 w-8 text-indigo-600" />
                <span className="font-semibold">Dicter</span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-100 bg-slate-50/80 p-5 text-center transition hover:border-slate-300"
                onClick={() => setOverlayMode("write")}
              >
                <PenLine className="h-8 w-8 text-slate-700" />
                <span className="font-semibold">Écrire</span>
              </button>
            </div>
          ) : null}

          {overlayMode === "dictate" ? (
            <div className="space-y-3">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 py-5">
                {recording ? (
                  <>
                    <Mic className="h-8 w-8 animate-pulse text-indigo-600" />
                    <p className="font-mono text-lg font-semibold">
                      {formatRecordingTime(recordingSeconds)}
                    </p>
                    <Button type="button" variant="destructive" size="sm" onClick={stopRecording}>
                      <MicOff className="mr-2 h-4 w-4" />
                      Terminer
                    </Button>
                  </>
                ) : hasRecording ? (
                  <Button type="button" disabled={submitting} onClick={() => void submitAudio()}>
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Transcrire &amp; synthétiser
                  </Button>
                ) : (
                  <Button type="button" size="sm" onClick={() => void startRecording()}>
                    Relancer le micro
                  </Button>
                )}
              </div>
            </div>
          ) : null}

          {overlayMode === "write" ? (
            <div className="space-y-3">
              <Textarea
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                rows={5}
                autoFocus
                placeholder="Que s'est-il passé ?"
              />
              <Button
                type="button"
                className="w-full"
                disabled={submitting || !draftNotes.trim()}
                onClick={() => void submitPostCallNotes(true)}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Générer la synthèse IA
              </Button>
            </div>
          ) : null}

          <DialogFooter>
            {overlayMode !== "choose" ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (recording) stopRecording();
                  resetRecordingState();
                  setOverlayMode("choose");
                }}
              >
                Retour
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => finishCallFlow()}>
              Plus tard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
