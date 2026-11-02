import { DEPOSIT_EARLY, DOSSIER_STEPS } from "@/lib/financement-opco";
import { NumberedSteps } from "@/components/site/steps";
import { Band, H2 } from "@/components/site/ui";

export function OpcoDossier() {
  return (
    <Band>
      <H2>
        On s&apos;occupe du dossier.
        <span className="block text-[#6E5BFF]">Vous vous occupez de vos équipes.</span>
      </H2>
      <NumberedSteps steps={DOSSIER_STEPS} className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5" />
      <div className="mt-6 flex items-start gap-4 rounded-[28px] bg-[#0B0D14] px-5 py-5 text-white">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F5C85C] text-[18px] font-extrabold text-[#0B0D14]" aria-hidden>
          !
        </span>
        <p className="text-[16px] leading-relaxed">{DEPOSIT_EARLY}</p>
      </div>
    </Band>
  );
}
