"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  CURRENT_SITUATION_OPTIONS,
  DEADLINE_OPTIONS,
  SUPPORT_PREFERENCE_OPTIONS,
  type CurrentSituationOption,
  type DeadlineOption,
  type PersonalizedPathRequestPayload,
  type SupportPreferenceOption,
} from "@/lib/apprenant/edge-personalized-path-request";
import { EdgeSelect } from "@/components/ui/edge-select";

type Props = {
  open: boolean;
  onClose: () => void;
  defaultObjective?: string;
  prioritySkills?: string[];
  onSubmittedSuccess?: () => void;
};

export function EdgeParcoursRequestModal({
  open,
  onClose,
  defaultObjective = "",
  prioritySkills = [],
  onSubmittedSuccess,
}: Props) {
  const [objective, setObjective] = useState(defaultObjective);
  const [currentStatus, setCurrentStatus] = useState<CurrentSituationOption>("etudiant");
  const [deadline, setDeadline] = useState<DeadlineOption>("1_3_mois");
  const [supportPreference, setSupportPreference] = useState<SupportPreferenceOption>("guide");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setObjective(defaultObjective);
      setConfirmed(false);
      setError(null);
    }
  }, [open, defaultObjective]);

  if (!open) return null;

  const resetAndClose = () => {
    setConfirmed(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim()) {
      setError("Indiquez votre objectif professionnel.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const payload: PersonalizedPathRequestPayload = {
      objective: objective.trim(),
      currentStatus,
      deadline,
      supportPreference,
      message: message.trim() || undefined,
      prioritySkills,
    };

    try {
      const res = await fetch("/api/learner/personalized-path-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? "Envoi impossible");
      }
      setConfirmed(true);
      onSubmittedSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[175] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/65" onClick={resetAndClose} aria-label="Fermer" />
      <div
        role="dialog"
        className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#12141C] shadow-2xl sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <h2 className="text-base font-semibold text-white">
            {confirmed ? "Demande envoyée" : "Demander mon parcours personnalisé"}
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-full border border-white/10 p-1.5 text-white/50 hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {confirmed ? (
            <div className="space-y-4 py-4 text-center">
              <p className="text-lg font-semibold text-white">Votre demande a bien été envoyée.</p>
              <p className="text-sm leading-relaxed text-white/60">
                Un conseiller EDGE va analyser votre profil afin de vous proposer un parcours réellement
                adapté.
              </p>
              <button
                type="button"
                onClick={resetAndClose}
                className="mt-4 w-full rounded-lg bg-white py-3 text-sm font-medium text-[#0a0a0a] hover:bg-white/90"
              >
                Retour à mon dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-white/55">
                Un conseiller EDGE construira une recommandation sur mesure à partir de vos résultats.
              </p>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-white/70">Objectif professionnel visé</span>
                <input
                  type="text"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#3D7BFF]/50 focus:outline-none"
                  placeholder="Ex. Commercial automobile"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-white/70">Situation actuelle</span>
                <EdgeSelect
                  value={currentStatus}
                  onChange={(v) => setCurrentStatus(v as CurrentSituationOption)}
                  options={CURRENT_SITUATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-white/70">Échéance</span>
                <EdgeSelect
                  value={deadline}
                  onChange={(v) => setDeadline(v as DeadlineOption)}
                  options={DEADLINE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-white/70">Préférence</span>
                <EdgeSelect
                  value={supportPreference}
                  onChange={(v) => setSupportPreference(v as SupportPreferenceOption)}
                  options={SUPPORT_PREFERENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-white/70">Message libre (optionnel)</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#3D7BFF]/50 focus:outline-none"
                  placeholder="Expliquez brièvement votre objectif ou votre situation."
                />
              </label>

              {error ? <p className="text-sm text-red-400">{error}</p> : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-[#3D7BFF] py-3 text-sm font-semibold text-white hover:bg-[#2F6AE8] disabled:opacity-60"
              >
                {submitting ? "Envoi…" : "Envoyer ma demande"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
