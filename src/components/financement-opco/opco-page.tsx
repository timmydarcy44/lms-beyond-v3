import { OpcoCoverage } from "@/components/financement-opco/coverage";
import { OpcoCovered } from "@/components/financement-opco/covered";
import { OpcoDossier } from "@/components/financement-opco/dossier";
import { OpcoFaq } from "@/components/financement-opco/faq";
import { OpcoHero } from "@/components/financement-opco/hero";
import { OpcoVerifierForm } from "@/components/financement-opco/verifier-form";
import { OpcoWhat } from "@/components/financement-opco/what";
import type { FormationOption } from "@/lib/financement-opco";

export function OpcoPage({
  entreprisesHref,
  contactHref,
  privacyHref,
  formations,
}: {
  entreprisesHref: string;
  contactHref: string;
  privacyHref: string;
  formations: FormationOption[];
}) {
  return (
    <div className="overflow-x-clip bg-[#F4F4F1] text-[#0B0D14]">
      <OpcoHero entreprisesHref={entreprisesHref} contactHref={contactHref} />
      <OpcoWhat />
      <OpcoCoverage recruterHref={entreprisesHref} />
      <OpcoCovered />
      <OpcoDossier />
      <OpcoVerifierForm formations={formations} privacyHref={privacyHref} />
      <OpcoFaq />
    </div>
  );
}
