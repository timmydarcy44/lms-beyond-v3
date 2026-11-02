import Link from "next/link";
import { focusRing } from "@/components/financement/ui";

export function FinancementFinalCta({ contactHref }: { contactHref: string }) {
  return (
    <section id="contact-conseiller" className="bg-[#F4F4F1] px-6 pb-16 md:pb-[104px]">
      <div className="mx-auto flex max-w-[1240px] flex-col items-start justify-between gap-8 rounded-[40px] bg-[#070C1C] px-8 py-12 text-white md:flex-row md:items-center md:px-14">
        <div className="max-w-xl">
          <h2 className="text-[36px] font-extrabold leading-[1.05] tracking-[-2px] md:text-[52px]">Un doute sur votre situation ?</h2>
          <p className="mt-4 text-[18px] leading-relaxed text-white/75">
            Un conseiller Byound étudie votre cas avec vous et vérifie votre éligibilité. Gratuit et sans engagement.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link href={contactHref} className={`inline-flex h-14 items-center justify-center rounded-full bg-white px-6 text-[15px] font-extrabold text-[#0B0D14] no-underline ${focusRing}`}>
            Être rappelé
          </Link>
          <Link href={contactHref} className={`inline-flex h-14 items-center justify-center rounded-full border border-white/30 px-6 text-[15px] font-extrabold text-white no-underline ${focusRing}`}>
            Prendre rendez-vous
          </Link>
        </div>
      </div>
    </section>
  );
}
