"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminTeamStep } from "@/components/onboarding/admin-team-step";
import { CsvImportStep } from "@/components/onboarding/csv-import-step";
import { InviteCollaboratorsStep } from "@/components/onboarding/invite-collaborators-step";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "account", label: "Compte activé" },
  { key: "admins", label: "Équipe RH" },
  { key: "import", label: "Import équipes" },
  { key: "invite", label: "Inviter collaborateurs" },
] as const;

type OnboardingStepperProps = {
  organisationId: string;
};

export function OnboardingStepper({ organisationId }: OnboardingStepperProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState("");
  const [importDone, setImportDone] = useState(false);
  const [importStats, setImportStats] = useState<{
    total: number;
    departments: string[];
    sansEmail: number;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/onboarding/organisation/${organisationId}`);
        const json = (await res.json()) as { name?: string; onboarding_step?: string };
        if (json.name) setOrgName(json.name);
        const s = json.onboarding_step ?? "";
        if (s === "teams_created" || s === "employees_imported" || s === "employees_invited") {
          setImportDone(true);
          setStep(3);
        } else if (s === "account_activated" || s === "invite_sent") {
          setStep(1);
        }
      } catch {
        setStep(1);
      }
    })();
  }, [organisationId]);

  const onImportComplete = useCallback(
    (stats: { total: number; departments: string[]; sansEmail: number }) => {
      setImportStats(stats);
      setImportDone(true);
      setStep(3);
    },
    [],
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Beyond RH</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Configuration de {orgName || "votre organisation"}
        </h1>
      </div>

      <div className="flex items-center justify-between gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border-2",
                i < step
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : i === step
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-400",
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3 fill-current" />}
            </div>
            <span className="text-center text-[10px] font-medium text-gray-600 sm:text-xs">{s.label}</span>
          </div>
        ))}
      </div>

      {step === 0 ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-lg font-semibold text-emerald-900">Compte activé</p>
          <p className="mt-2 text-sm text-emerald-800">
            Bienvenue. Importez vos collaborateurs pour créer vos équipes automatiquement.
          </p>
          <Button className="mt-4" onClick={() => setStep(1)}>
            Continuer — Import CSV
          </Button>
        </section>
      ) : null}

      {step === 1 ? (
        <AdminTeamStep
          organisationId={organisationId}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      ) : null}

      {step === 2 ? (
        <CsvImportStep organisationId={organisationId} onComplete={onImportComplete} />
      ) : null}

      {step === 3 && importDone ? (
        <InviteCollaboratorsStep
          organisationId={organisationId}
          companyName={orgName}
          importedCount={importStats?.total ?? 0}
          sansEmail={importStats?.sansEmail ?? 0}
          onFinish={() => router.push("/dashboard/entreprise")}
        />
      ) : null}

      <p className="text-center text-xs text-gray-500">
        <Link href="/dashboard/entreprise" className="underline">
          Passer — aller au tableau de bord
        </Link>
      </p>
    </div>
  );
}
