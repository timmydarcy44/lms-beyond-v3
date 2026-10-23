"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminTeamStep } from "@/components/onboarding/admin-team-step";
import { CsvImportStep } from "@/components/onboarding/csv-import-step";
import { InviteCollaboratorsStep } from "@/components/onboarding/invite-collaborators-step";

const STEPS = ["Équipe RH", "Import", "Invitations", "Prêt"] as const;

type Props = { organisationId: string };

function stepFromServer(value: string) {
  if (value === "employees_invited" || value === "active" || value === "first_diagnostic_done") return 3;
  if (value === "teams_created" || value === "employees_imported") return 2;
  return 0;
}

export function OnboardingStepper({ organisationId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [viewerName, setViewerName] = useState("");
  const [viewerEmail, setViewerEmail] = useState("");
  const [importStats, setImportStats] = useState<{ total: number; departments: string[]; sansEmail: number } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/onboarding/organisation/${organisationId}`);
        const json = (await res.json()) as {
          name?: string;
          onboarding_step?: string;
          employee_count?: number;
          viewer_name?: string;
          viewer_email?: string;
        };
        if (json.name) setOrgName(json.name);
        if (json.viewer_name) setViewerName(json.viewer_name);
        if (json.viewer_email) setViewerEmail(json.viewer_email);
        const next = stepFromServer(json.onboarding_step ?? "");
        setStep(next);
        if ((json.employee_count ?? 0) > 0) {
          setImportStats({ total: json.employee_count ?? 0, departments: [], sansEmail: 0 });
        }
      } catch {
        setStep(0);
      }
    })();
  }, [organisationId]);

  const onImportComplete = useCallback((stats: { total: number; departments: string[]; sansEmail: number }) => {
    setImportStats(stats);
    setStep(2);
  }, []);

  const finish = async () => {
    await fetch(`/api/onboarding/organisation/${organisationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboarding_step: "active" }),
    }).catch(() => undefined);
    router.push("/dashboard/entreprise");
  };

  const optional = step === 1 || step === 2;

  return (
    <div className="min-h-dvh bg-[#F4F4F1] text-[#07080B]">
      <header className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#07080B] text-[12px] font-extrabold text-white">
            BY
          </span>
          <span className="truncate text-[15px] font-extrabold">Espace {orgName || "entreprise"}</span>
        </div>
        <div className="hidden text-center sm:block">
          <p className="text-[13px] font-extrabold">Étape {step + 1} sur 4</p>
          <div className="mt-2 flex gap-1">
            {STEPS.map((label, index) => (
              <span
                key={label}
                className={`h-1.5 w-10 rounded-full ${
                  index < step ? "bg-[#6E5BFF]" : index === step ? "bg-[#07080B]" : "bg-[#E3E0D8]"
                }`}
              />
            ))}
          </div>
        </div>
        {optional ? (
          <button type="button" onClick={() => setStep((value) => value + 1)} className="text-[14px] font-extrabold text-[#3A3D45]">
            Passer pour l&apos;instant
          </button>
        ) : (
          <span className="w-8" />
        )}
      </header>

      <p className="px-5 text-center text-[13px] font-extrabold sm:hidden">Étape {step + 1} sur 4 · {STEPS[step]}</p>

      <main className="mx-auto flex min-h-[calc(100dvh-96px)] w-full max-w-[600px] flex-col justify-center px-5 py-8">
        {step === 0 ? (
          <AdminTeamStep
            organisationId={organisationId}
            viewerName={viewerName}
            viewerEmail={viewerEmail}
            onNext={() => setStep(1)}
          />
        ) : null}
        {step === 1 ? (
          <CsvImportStep organisationId={organisationId} onBack={() => setStep(0)} onComplete={onImportComplete} />
        ) : null}
        {step === 2 ? (
          <InviteCollaboratorsStep
            organisationId={organisationId}
            companyName={orgName}
            importedCount={importStats?.total ?? 0}
            sansEmail={importStats?.sansEmail ?? 0}
            senderName={viewerName}
            onBack={() => setStep(1)}
            onFinish={() => setStep(3)}
          />
        ) : null}
        {step === 3 ? (
          <ReadyStep companyName={orgName} onBack={() => setStep(2)} onDashboard={() => void finish()} />
        ) : null}
      </main>
    </div>
  );
}

function ReadyStep({
  companyName,
  onBack,
  onDashboard,
}: {
  companyName: string;
  onBack: () => void;
  onDashboard: () => void;
}) {
  const cards = [
    ["Lancer un diagnostic", "/dashboard/entreprise/actions", true],
    ["Assigner une formation", "/dashboard/entreprise/formations/catalogue", false],
    ["Publier une offre", "/dashboard/entreprise/offres/creer", false],
  ] as const;

  return (
    <div>
      <p className="text-[13px] font-extrabold text-[#4B3BD1]">Configuration terminée</p>
      <h1 className="mt-3 text-[36px] font-extrabold leading-tight tracking-[-1.2px]">
        {companyName || "Votre entreprise"} est prêt.
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-[#6B6F7A]">
        Votre essai de 30 jours commence aujourd&apos;hui. Par quoi voulez-vous commencer ?
      </p>
      <div className="mt-8 space-y-3">
        {cards.map(([label, href, primary]) => (
          <Link
            key={href}
            href={href}
            className={`block rounded-[22px] p-5 text-[16px] font-extrabold ${
              primary ? "bg-[#6E5BFF] text-white" : "border border-[#E3E0D8] bg-white text-[#07080B]"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="mt-8 flex items-center gap-3">
        <button type="button" onClick={onBack} aria-label="Retour" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#E3E0D8] bg-white text-[22px]">
          ‹
        </button>
        <button type="button" onClick={onDashboard} className="h-14 flex-1 rounded-full bg-[#07080B] text-[16px] font-extrabold text-white">
          Aller au tableau de bord
        </button>
      </div>
    </div>
  );
}
