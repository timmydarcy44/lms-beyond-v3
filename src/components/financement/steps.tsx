import { NumberedSteps } from "@/components/site/steps";
import { Band, H2 } from "@/components/financement/ui";
import { DOSSIER_STEPS } from "@/lib/financement";

export function FinancementSteps() {
  return (
    <Band className="bg-white">
      <H2>On s&apos;occupe du dossier avec vous.</H2>
      <NumberedSteps steps={DOSSIER_STEPS} cardClassName="bg-[#F4F4F1]" className="mt-10 grid gap-4 md:grid-cols-4" />
    </Band>
  );
}
