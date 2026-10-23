import { Manrope } from "next/font/google";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { OnboardingActivationGate } from "@/components/onboarding/onboarding-activation-gate";

const manrope = Manrope({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });

type Props = { params: Promise<{ organisationId: string }> };

export default async function OnboardingOrganisationPage({ params }: Props) {
  const { organisationId } = await params;
  return (
    <div className={manrope.className}>
      <OnboardingActivationGate>
        <OnboardingStepper organisationId={organisationId} />
      </OnboardingActivationGate>
    </div>
  );
}
