"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { AdmissionFrieze, friezeFromStatus } from "@/components/edge-site/cfa/admission-frieze";
import { AdmissionShell, type SaveState } from "@/components/edge-site/cfa/admission-shell";
import {
  ChallengeParcoursStep,
  FilierePill,
} from "@/components/edge-site/cfa/challenge-parcours-step";
import { ChallengeReviewStep } from "@/components/edge-site/cfa/challenge-review-step";
import type {
  ChallengeQuestionRow,
  ChallengeV2State,
  ParcoursState,
} from "@/lib/cfa/admission-challenge";
import { getFallbackQuestionsForSpecialization } from "@/lib/cfa/admission-challenge-fallback";
import type { CfaApplication } from "@/lib/cfa-applications";
import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";
import { cn } from "@/lib/utils";

type AccessibilityState = {
  needsAccommodation: boolean | null;
  needsDetail: string;
  rqth: "yes" | "no" | "prefer_not" | null;
};

type Props = {
  app: CfaApplication & {
    parcours?: ParcoursState;
    challenge_v2?: ChallengeV2State;
    share_with_companies?: boolean;
  };
  token: string;
  cvName: string;
  setCvName: (name: string) => void;
  onApplication: (app: CfaApplication) => void;
  onRequestChangeSpecialization: () => void;
};

export function CfaChallengeParcoursFlow({
  app,
  token,
  cvName,
  setCvName,
  onApplication,
  onRequestChangeSpecialization,
}: Props) {
  const [questions, setQuestions] = useState<ChallengeQuestionRow[]>([]);
  const [prerequisiteLabel, setPrerequisiteLabel] = useState<string | null>("un bac");
  const [challenge, setChallenge] = useState<ChallengeV2State>(() => ({
    responses: app.challenge_v2?.responses ?? [],
    hiddenBySpecializationChange: app.challenge_v2?.hiddenBySpecializationChange ?? {},
  }));
  const [parcours, setParcours] = useState<ParcoursState>(() => app.parcours ?? {});
  const [alternanceStatus, setAlternanceStatus] = useState<"" | "company_found" | "searching">(
    (app.alternance_status as "" | "company_found" | "searching") || "",
  );
  const [shareCompanies, setShareCompanies] = useState(Boolean(app.share_with_companies));
  const [accessibility, setAccessibility] = useState<AccessibilityState>({
    needsAccommodation: null,
    needsDetail: "",
    rqth: null,
  });
  const [reviewing, setReviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [continueMessage, setContinueMessage] = useState("");
  const [confirmChangeSpec, setConfirmChangeSpec] = useState(false);
  const [error, setError] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const online = typeof navigator === "undefined" ? true : navigator.onLine;

  useEffect(() => {
    const onOffline = () => setSaveState("offline");
    const onOnline = () => setSaveState("saved");
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch(
          `/api/cfa/applications/questions?specialization=${encodeURIComponent(app.specialization)}`,
        );
        if (!response.ok) throw new Error();
        const data = await response.json();
        setQuestions(data.questions ?? getFallbackQuestionsForSpecialization(app.specialization));
        setPrerequisiteLabel(data.prerequisiteLabel ?? "un bac");
      } catch {
        setQuestions(getFallbackQuestionsForSpecialization(app.specialization));
      }
    })();
  }, [app.specialization]);

  const persist = useCallback(
    async (action: "save_draft_v2" | "submit_v2" | "continue_later") => {
      if (!online && action === "save_draft_v2") {
        setSaveState("offline");
        return null;
      }
      setSaveState("saving");
      const response = await fetch("/api/cfa/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          action,
          challengeV2: challenge,
          parcours,
          alternanceStatus,
          shareWithCompanies: shareCompanies,
          accessibility,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setSaveState("idle");
        throw new Error(result.error || "Enregistrement impossible.");
      }
      setSaveState("saved");
      onApplication(result.application);
      return result.application as CfaApplication;
    },
    [accessibility, alternanceStatus, challenge, online, onApplication, parcours, shareCompanies, token],
  );

  useEffect(() => {
    if (reviewing) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist("save_draft_v2").catch(() => setSaveState(online ? "idle" : "offline"));
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [challenge, parcours, alternanceStatus, shareCompanies, accessibility, persist, reviewing, online]);

  async function uploadCv(file: File) {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("token", token);
      body.set("kind", "cv");
      body.set("file", file);
      const response = await fetch("/api/cfa/applications/upload", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setCvName(file.name);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Téléversement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadMedia(file: File, questionId: string) {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("token", token);
      body.set("kind", "challenge_media");
      body.set("questionId", questionId);
      body.set("file", file);
      const response = await fetch("/api/cfa/applications/upload", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      return String(result.path);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Téléversement impossible.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdmissionShell
      saveState={saveState}
      continueBusy={busy}
      continueMessage={continueMessage}
      onContinueLater={() => {
        setBusy(true);
        void persist("continue_later")
          .then(() =>
            setContinueMessage("On t’a envoyé un lien pour reprendre où tu en étais."),
          )
          .catch((cause) =>
            setError(cause instanceof Error ? cause.message : "Envoi impossible."),
          )
          .finally(() => setBusy(false));
      }}
    >
      <p className="text-sm font-semibold text-[#A99BFF]">Byound School · Admission</p>
      <h1 className="mt-3 text-[clamp(2.2rem,5vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.04em]">
        Montre-nous comment tu penses.
      </h1>
      <p className="mt-3 max-w-2xl text-[#9AA3BD]">
        Ton potentiel d’abord. L’entreprise et le financement viennent après l’admission.
      </p>
      <FilierePill
        specialization={app.specialization}
        onChange={() => setConfirmChangeSpec(true)}
      />
      <AdmissionFrieze current={friezeFromStatus(app.status, reviewing)} />

      {error ? <p className="mt-4 text-sm text-[#F2CF6B]">{error}</p> : null}

      {confirmChangeSpec ? (
        <div className="mt-6 rounded-[22px] border border-[#F2CF6B]/40 bg-[#F2CF6B]/10 p-5 text-sm">
          <p className="font-semibold text-[#F2CF6B]">Changer de filière ?</p>
          <p className="mt-2 text-[#F2F4FA]/85">
            Tes réponses propres à la filière actuelle seront conservées mais masquées. Tu
            répondras aux questions de la nouvelle filière.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CFA_SPECIALIZATIONS.slice(0, 6).map((item) => (
              <button
                key={item.value}
                type="button"
                disabled={busy || item.value === app.specialization}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold",
                  item.value === app.specialization
                    ? "border-[#6E5BFF] bg-[#6E5BFF]/20"
                    : "border-[#26304F]",
                )}
                onClick={() => {
                  setBusy(true);
                  void fetch("/api/cfa/applications", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      token,
                      action: "change_specialization",
                      specialization: item.value,
                    }),
                  })
                    .then(async (response) => {
                      const result = await response.json();
                      if (!response.ok) throw new Error(result.error);
                      onApplication(result.application);
                      setChallenge({
                        responses: [],
                        hiddenBySpecializationChange:
                          result.application.challenge_v2?.hiddenBySpecializationChange ?? {},
                      });
                      setConfirmChangeSpec(false);
                    })
                    .catch((cause) =>
                      setError(cause instanceof Error ? cause.message : "Changement impossible."),
                    )
                    .finally(() => setBusy(false));
                }}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              className="rounded-full border border-[#26304F] px-3 py-1.5 text-xs font-semibold"
              onClick={() => setConfirmChangeSpec(false)}
            >
              Annuler
            </button>
          </div>
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-[#A99BFF]"
            onClick={onRequestChangeSpecialization}
          >
            Ou revenir à l’étape Profil →
          </button>
        </div>
      ) : null}

      {!questions.length ? (
        <div className="mt-16 flex justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#6E5BFF]" />
        </div>
      ) : reviewing ? (
        <ChallengeReviewStep
          specialization={app.specialization}
          responses={challenge.responses}
          parcours={parcours}
          alternanceStatus={alternanceStatus}
          shareCompanies={shareCompanies}
          cvName={cvName}
          token={token}
          busy={busy}
          onEdit={() => setReviewing(false)}
          onSubmit={() => {
            setBusy(true);
            setError("");
            void persist("submit_v2")
              .catch((cause) =>
                setError(cause instanceof Error ? cause.message : "Envoi impossible."),
              )
              .finally(() => setBusy(false));
          }}
        />
      ) : (
        <ChallengeParcoursStep
          specialization={app.specialization}
          resumeToken={token}
          questions={questions}
          challenge={challenge}
          parcours={parcours}
          alternanceStatus={alternanceStatus}
          shareCompanies={shareCompanies}
          cvName={cvName}
          prerequisiteLabel={prerequisiteLabel}
          accessibility={accessibility}
          busy={busy}
          onChangeSpecialization={() => setConfirmChangeSpec(true)}
          onChallengeChange={setChallenge}
          onParcoursChange={setParcours}
          onAlternanceChange={setAlternanceStatus}
          onShareCompaniesChange={setShareCompanies}
          onAccessibilityChange={setAccessibility}
          onUploadCv={uploadCv}
          onUploadMedia={uploadMedia}
          onReview={() => setReviewing(true)}
        />
      )}
    </AdmissionShell>
  );
}
