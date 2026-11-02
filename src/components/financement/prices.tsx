import { priceCases } from "@/lib/financement";
import { Band, H2 } from "@/components/financement/ui";

export function FinancementPrices() {
  return (
    <Band id="combien" dark>
      <H2 light>Combien je paie ?</H2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {priceCases().map((item) => (
          <article key={item.id} className="rounded-[32px] border border-[#FFFFFF14] bg-[#FFFFFF0A] p-6">
            <h3 className="text-[18px] font-extrabold">{item.title}</h3>
            <p className="mt-6 inline-flex rounded-[20px] bg-[#070C1C] px-5 py-4 text-[48px] font-extrabold leading-none tracking-[-2px]">
              {item.amount}
            </p>
            <p className="mt-5 text-[15px] leading-relaxed text-white/70">{item.text}</p>
          </article>
        ))}
      </div>
    </Band>
  );
}
