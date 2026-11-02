import { CPF_NOTE, FINANCEMENT_FLAGS, solutionCards } from "@/lib/financement";
import { Band, H2 } from "@/components/financement/ui";

export function FinancementSolutions() {
  const cards = solutionCards();
  return (
    <Band id="solutions" className="bg-white">
      <H2>Toutes les solutions.</H2>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.id} className="flex min-h-[280px] flex-col rounded-[28px] bg-[#F4F4F1] p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-[#EEEBFF] px-3 text-[12px] font-extrabold text-[#6E5BFF]">
                {card.abbr}
              </span>
              <span className="text-[13px] font-bold text-[#4A4F5C]">{card.audience}</span>
            </div>
            <h3 className="mt-6 text-[22px] font-extrabold tracking-[-0.5px] text-[#0B0D14]">{card.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[#4A4F5C]">{card.text}</p>
            <div className="mt-auto flex items-end justify-between gap-3 pt-8">
              {card.keyValue ? (
                <p>
                  <span className="block text-[13px] text-[#4A4F5C]">{card.keyLabel}</span>
                  <span className="text-[28px] font-extrabold tracking-[-1px] text-[#0B0D14]">{card.keyValue}</span>
                </p>
              ) : <span />}
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#0B0D14] text-white" aria-hidden>
                ›
              </span>
            </div>
          </article>
        ))}
      </div>
      {FINANCEMENT_FLAGS.cpfEligible ? <p className="mt-6 max-w-4xl text-[14px] leading-relaxed text-[#4A4F5C]">{CPF_NOTE}</p> : null}
    </Band>
  );
}
