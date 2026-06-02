import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { OnboardingActivationGate } from "@/components/onboarding/onboarding-activation-gate";

type Props = { params: Promise<{ organisationId: string }> };

export default async function OnboardingOrganisationPage({ params }: Props) {
  const { organisationId } = await params;
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/80 to-white">
      <OnboardingActivationGate>
        <OnboardingStepper organisationId={organisationId} />
      </OnboardingActivationGate>
    </div>
  );
}
