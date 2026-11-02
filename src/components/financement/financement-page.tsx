import { FinancementFaq } from "@/components/financement/faq";
import { FinancementFinalCta } from "@/components/financement/final-cta";
import { FinancementHero } from "@/components/financement/hero";
import { FinancementHiring } from "@/components/financement/hiring";
import { FinancementPrices } from "@/components/financement/prices";
import { FinancementSituation } from "@/components/financement/situation";
import { FinancementSolutions } from "@/components/financement/solutions";
import { FinancementSteps } from "@/components/financement/steps";

export function FinancementPage({
  schoolHref,
  contactHref,
  offresHref,
  entreprisesHref,
}: {
  schoolHref: string;
  contactHref: string;
  offresHref: string;
  entreprisesHref: string;
}) {
  return (
    <div className="overflow-x-clip bg-[#F4F4F1] text-[#0B0D14]">
      <FinancementHero schoolHref={schoolHref} contactHref={contactHref} />
      <FinancementSituation offresHref={offresHref} recruterHref={entreprisesHref} />
      <FinancementSolutions />
      <FinancementPrices />
      <FinancementHiring entreprisesHref={entreprisesHref} />
      <FinancementSteps />
      <FinancementFaq />
      <FinancementFinalCta contactHref={contactHref} />
    </div>
  );
}
