"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mic, MicOff, PenLine, Phone, Sparkles } from "lucide-react";
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
  type PipelineActionType,
} from "@/lib/crm/pipeline-deal-action-types";

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

function formatRecordingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PipelineDealActionsSection({
  dealId,
  phone,
  companyName,
  contactName,
  currentUserEmail,
  onActionsChange,
}: {
  dealId?: string;
  phone?: string | null;
  companyName: string;
  contactName: string;
  currentUserEmail: string | null;
  onActionsChange?: () => void;
}) {
  const [actions, setActions] = useState<PipelineDealAction[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<PipelineActionType>("call_success");
  const [notes, setNotes] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [postCallOverlayOpen, setPostCallOverlayOpen] = useState(false);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>("choose");
  const [recording, setRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const callPendingRef = useRef(false);
  const leftPageRef = useRef(false);
  const dictateAutoStartedRef = useRef(false);

  const displayContact = contactName.trim() || companyName;

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
  }, []);

  useEffect(() => {
    if (!callActive) return;

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        leftPageRef.current = true;
      } else if (
        document.visibilityState === "visible" &&
        callPendingRef.current &&
        leftPageRef.current
      ) {
        openPostCallOverlay();
      }
    };

    const onFocus = () => {
      if (callPendingRef.current && leftPageRef.current) {
        openPostCallOverlay();
      }
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
      toast.error("Microphone inaccessible — autorisez l'accès ou choisissez « Écrire ».");
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

  const submitNotes = async (withAi: boolean) => {
    if (!dealId) {
      toast.error("Enregistrez la fiche avant d'ajouter une action.");
      return;
    }
    if (!notes.trim()) {
      toast.error("Ajoutez un compte-rendu.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/super-admin/crm/pipeline/deals/${dealId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_type: actionType,
          notes: notes.trim(),
          with_ai_summary: withAi,
          created_by_email: currentUserEmail,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNotes("");
      finishCallFlow();
      await load();
      onActionsChange?.();
      toast.success(withAi ? "Synthèse IA enregistrée" : "Action enregistrée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const submitAudio = async () => {
    if (!dealId) {
      toast.error("Enregistrez la fiche d'abord.");
      return;
    }
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    if (blob.size < 1000) {
      toast.error("Enregistrement audio trop court.");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("audio", blob, "call.webm");
      form.append("action_type", actionType);
      if (notes.trim()) form.append("notes", notes.trim());
      if (currentUserEmail) form.append("created_by_email", currentUserEmail);

      const res = await fetch(
        `/api/super-admin/crm/pipeline/deals/${dealId}/actions/transcribe`,
        { method: "POST", body: form },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNotes("");
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

  const closeOverlayLater = () => {
    if (recording) stopRecording();
    setPostCallOverlayOpen(false);
    setOverlayMode("choose");
    resetRecordingState();
  };

  const actionTypePicker = (
    <div className="space-y-2">
      <Label>Résultat de l&apos;appel</Label>
      <div className="flex flex-wrap gap-1.5">
        {PIPELINE_ACTION_TYPES.filter((t) =>
          ["call_success", "call_no_answer", "call_voicemail", "call_busy", "call_failed"].includes(
            t.value,
          ),
        ).map((t) => (
          <button
            key={t.value}
            type="button"
            className={`rounded-full border px-2.5 py-1 text-xs transition ${
              actionType === t.value
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
            }`}
            onClick={() => setActionType(t.value)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (!dealId) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
        Enregistrez la fiche pour journaliser les appels et actions commerciales.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 border-t border-gray-200 pt-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Actions</p>
          <p className="text-xs text-gray-500">
            Appels, synthèses IA et historique pour {companyName}
          </p>
        </div>

        {callActive && !postCallOverlayOpen ? (
          <div className="flex flex-col gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-indigo-900">
              Appel avec <span className="font-semibold">{displayContact}</span>
            </p>
            <Button type="button" size="sm" onClick={openPostCallOverlay}>
              Résumer l&apos;appel
            </Button>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {phone?.trim() ? (
            <Button type="button" variant="default" size="sm" onClick={startCall}>
              <Phone className="mr-2 h-4 w-4" />
              Appeler via EDGE
            </Button>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>Type d&apos;action</Label>
          <div className="flex flex-wrap gap-1.5">
            {PIPELINE_ACTION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  actionType === t.value
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                }`}
                onClick={() => setActionType(t.value)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes / compte-rendu</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Synthèse, objections, prochaines étapes…"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={submitting}
            onClick={() => void submitNotes(false)}
          >
            Enregistrer
          </Button>
          <Button type="button" size="sm" disabled={submitting} onClick={() => void submitNotes(true)}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Synthèse IA
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Historique</p>
          {loading ? (
            <p className="text-sm text-gray-500">Chargement…</p>
          ) : actions.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune action enregistrée.</p>
          ) : (
            <ul className="space-y-2">
              {actions.map((a) => (
                <li key={a.id} className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-900">
                      {pipelineActionLabel(a.action_type)}
                    </span>
                    <span className="text-xs text-gray-500">{a.created_at.slice(0, 10)}</span>
                  </div>
                  {a.ai_summary ? (
                    <p className="mt-2 whitespace-pre-wrap text-xs text-gray-700">{a.ai_summary}</p>
                  ) : a.notes ? (
                    <p className="mt-2 text-xs text-gray-600">{a.notes}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Dialog
        open={postCallOverlayOpen}
        onOpenChange={(open) => {
          if (!open) closeOverlayLater();
        }}
      >
        <DialogContent className="gap-5 sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Maintenant, résumons l&apos;appel</DialogTitle>
            <DialogDescription>
              Avec {displayContact} — dictez ou écrivez ce qui s&apos;est passé, l&apos;IA
              structurera la synthèse.
            </DialogDescription>
          </DialogHeader>

          {overlayMode === "choose" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-indigo-100 bg-indigo-50/80 p-5 text-center transition hover:border-indigo-400 hover:bg-indigo-50"
                onClick={() => setOverlayMode("dictate")}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Mic className="h-6 w-6" />
                </span>
                <span className="font-semibold text-gray-900">Dicter</span>
                <span className="text-xs text-gray-600">
                  Enregistrez un résumé oral — transcription &amp; synthèse IA
                </span>
              </button>
              <button
                type="button"
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-slate-100 bg-slate-50/80 p-5 text-center transition hover:border-slate-300 hover:bg-slate-50"
                onClick={() => setOverlayMode("write")}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-white">
                  <PenLine className="h-6 w-6" />
                </span>
                <span className="font-semibold text-gray-900">Écrire</span>
                <span className="text-xs text-gray-600">
                  Saisissez vos notes — synthèse IA en un clic
                </span>
              </button>
            </div>
          ) : null}

          {overlayMode !== "choose" ? actionTypePicker : null}

          {overlayMode === "dictate" ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-6">
                {recording ? (
                  <>
                    <span className="relative flex h-16 w-16 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-30" />
                      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white">
                        <Mic className="h-7 w-7" />
                      </span>
                    </span>
                    <p className="font-mono text-lg font-semibold text-indigo-900">
                      {formatRecordingTime(recordingSeconds)}
                    </p>
                    <p className="text-center text-sm text-indigo-800">
                      Parlez librement : points clés, objections, prochaine étape…
                    </p>
                    <Button type="button" variant="destructive" size="sm" onClick={stopRecording}>
                      <MicOff className="mr-2 h-4 w-4" />
                      Terminer l&apos;enregistrement
                    </Button>
                  </>
                ) : hasRecording ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">
                      Enregistrement prêt ({formatRecordingTime(recordingSeconds)})
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      disabled={submitting}
                      onClick={() => void submitAudio()}
                    >
                      {submitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Transcrire &amp; synthétiser
                    </Button>
                  </>
                ) : (
                  <Button type="button" size="sm" onClick={() => void startRecording()}>
                    <Mic className="mr-2 h-4 w-4" />
                    Relancer le micro
                  </Button>
                )}
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Notes complémentaires (optionnel)"
              />
            </div>
          ) : null}

          {overlayMode === "write" ? (
            <div className="space-y-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                autoFocus
                placeholder="Que s'est-il passé ? Objections, décisions, prochaine étape…"
              />
              <Button
                type="button"
                className="w-full"
                disabled={submitting || !notes.trim()}
                onClick={() => void submitNotes(true)}
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

          <DialogFooter className="gap-2 sm:justify-between">
            {overlayMode !== "choose" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (recording) stopRecording();
                  resetRecordingState();
                  setOverlayMode("choose");
                }}
              >
                Retour
              </Button>
            ) : (
              <span />
            )}
            <Button type="button" variant="outline" size="sm" onClick={closeOverlayLater}>
              Plus tard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
