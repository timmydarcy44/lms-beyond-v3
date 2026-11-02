import { FINANCEMENT_FAQ } from "@/lib/financement";
import { Band, H2, focusRing } from "@/components/financement/ui";

export function FinancementFaq() {
  return (
    <Band>
      <H2>Questions fréquentes</H2>
      <div className="mt-8 divide-y divide-[#0B0D14]/10 rounded-[32px] bg-white px-6">
        {FINANCEMENT_FAQ.map((item, index) => (
          <details key={item.question} className="group py-2" {...(index === 0 ? { open: true } : {})}>
            <summary className={`cursor-pointer list-none py-4 text-[17px] font-extrabold marker:content-none [&::-webkit-details-marker]:hidden ${focusRing}`}>
              <span className="flex items-center justify-between gap-4">
                {item.question}
                <span aria-hidden className="text-[22px] font-medium text-[#4A4F5C] group-open:hidden">+</span>
                <span aria-hidden className="hidden text-[22px] font-medium text-[#4A4F5C] group-open:inline">–</span>
              </span>
            </summary>
            <p className="pb-5 text-[16px] leading-relaxed text-[#4A4F5C]">
              {item.answer ?? "Réponse à valider."}
            </p>
          </details>
        ))}
      </div>
    </Band>
  );
}
