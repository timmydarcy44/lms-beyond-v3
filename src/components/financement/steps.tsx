import { DOSSIER_STEPS } from "@/lib/financement";
import { Band, H2 } from "@/components/financement/ui";

export function FinancementSteps() {
  return (
    <Band className="bg-white">
      <H2>On s&apos;occupe du dossier avec vous.</H2>
      <ol className="mt-10 grid gap-4 md:grid-cols-4">
        {DOSSIER_STEPS.map((step) => (
          <li key={step.n} className="rounded-[28px] bg-[#F4F4F1] p-6">
            <span className={step.n === "1" ? "grid h-10 w-10 place-items-center rounded-full bg-[#6E5BFF] text-[15px] font-extrabold text-white" : "grid h-10 w-10 place-items-center rounded-full bg-[#E6E4DE] text-[15px] font-extrabold text-[#0B0D14]"}>
              {step.n}
            </span>
            <h3 className="mt-6 text-[20px] font-extrabold tracking-[-0.4px]">{step.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[#4A4F5C]">{step.text}</p>
          </li>
        ))}
      </ol>
    </Band>
  );
}
