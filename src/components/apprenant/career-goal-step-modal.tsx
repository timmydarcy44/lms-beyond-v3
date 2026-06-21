"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CAREER_GOAL_NEEDS_HELP_VALUE,
  CAREER_GOAL_OPTIONS,
  CAREER_GOAL_OTHER_VALUE,
  type CareerGoalValue,
} from "@/lib/apprenant/career-goal-options";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";

type Props = {
  open: boolean;
  onSaved: () => void;
};

export function CareerGoalStepModal({ open, onSaved }: Props) {
  const [step, setStep] = useState<"question" | "jobs" | "needs_help_info">("question");
  const [selectedJob, setSelectedJob] = useState<CareerGoalValue | "">("");
  const [otherJob, setOtherJob] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const persist = async (career_goal: CareerGoalValue, career_goal_other?: string | null) => {
    setSaving(true);
    try {
      const res = await fetch("/api/beyond-connect/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          career_goal,
          career_goal_other: career_goal_other?.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error || "Enregistrement impossible");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleYes = () => setStep("jobs");

  const handleNeedsHelp = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/beyond-connect/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ career_goal: CAREER_GOAL_NEEDS_HELP_VALUE, career_goal_other: null }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error || "Enregistrement impossible");
      setStep("needs_help_info");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveJob = async () => {
    if (!selectedJob) {
      toast.error("Sélectionnez un métier ou choisissez Autre.");
      return;
    }
    if (selectedJob === CAREER_GOAL_OTHER_VALUE && !otherJob.trim()) {
      toast.error("Précisez votre métier.");
      return;
    }
    await persist(selectedJob, selectedJob === CAREER_GOAL_OTHER_VALUE ? otherJob : null);
  };

  return (
    <div className="fixed inset-0 z-[10006] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Orientation</p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          Savez-vous déjà quel métier vous souhaitez faire ?
        </h2>

        {step === "question" ? (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={handleYes} className={`${CONNECT_BTN_PRIMARY} flex-1`}>
              Oui
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleNeedsHelp()}
              className={`${CONNECT_BTN_SECONDARY} flex-1 disabled:opacity-50`}
            >
              {saving ? "Enregistrement…" : "Non, j'ai besoin d'aide"}
            </button>
          </div>
        ) : step === "needs_help_info" ? (
          <div className="mt-6 space-y-6">
            <p className="text-sm leading-relaxed text-white/80">
              Passez vos 3 tests et nous vous proposerons plusieurs métiers qui correspondent à votre profil.
            </p>
            <button type="button" onClick={onSaved} className={`${CONNECT_BTN_PRIMARY} w-full`}>
              Fermer
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid gap-2">
              {CAREER_GOAL_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                    selectedJob === option.value
                      ? "border-[#3D7BFF]/50 bg-[#3D7BFF]/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/80 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="career_goal"
                    className="accent-[#3D7BFF]"
                    checked={selectedJob === option.value}
                    onChange={() => setSelectedJob(option.value)}
                  />
                  {option.label}
                </label>
              ))}
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                  selectedJob === CAREER_GOAL_OTHER_VALUE
                    ? "border-[#3D7BFF]/50 bg-[#3D7BFF]/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/80 hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name="career_goal"
                  className="accent-[#3D7BFF]"
                  checked={selectedJob === CAREER_GOAL_OTHER_VALUE}
                  onChange={() => setSelectedJob(CAREER_GOAL_OTHER_VALUE)}
                />
                Autre
              </label>
            </div>
            {selectedJob === CAREER_GOAL_OTHER_VALUE ? (
              <input
                value={otherJob}
                onChange={(e) => setOtherJob(e.target.value)}
                placeholder="Précisez votre métier"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              />
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => setStep("question")} className={CONNECT_BTN_SECONDARY}>
                Retour
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveJob()}
                className={`${CONNECT_BTN_PRIMARY} flex-1 disabled:opacity-50`}
              >
                {saving ? "Enregistrement…" : "Continuer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
