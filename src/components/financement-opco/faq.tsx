import { SiteFaq } from "@/components/site/faq";
import { opcoFaq } from "@/lib/financement-opco";

export function OpcoFaq() {
  return <SiteFaq items={opcoFaq()} />;
}
