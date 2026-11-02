import Link from "next/link";
import { HERO_PLAN } from "@/lib/financement";
import { focusRing } from "@/components/financement/ui";

export function FinancementHero({
  schoolHref,
  contactHref,
}: {
  schoolHref: string;
  contactHref: string;
}) {
  return (
    <section className="relative overflow-hidden bg-[#070C1C] text-white">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(110,91,255,0.45), transparent 68%)" }}
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 px-6 pb-16 pt-32 md:py-[104px] md:pt-40 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="text-[15px] text-white/70">
            <Link href={schoolHref} className="text-white no-underline hover:underline">École</Link>
            <span aria-hidden> › </span>
            <span>Financer ma formation</span>
          </p>
          <h1 className="mt-6 max-w-[640px] text-[44px] font-extrabold leading-[1.02] tracking-[-2px] sm:text-[64px]">
            Financer ma formation.
          </h1>
          <p className="mt-5 max-w-[560px] text-[18px] leading-relaxed text-white/75">
            En alternance, votre formation est gratuite et rémunérée. Pour les autres situations, on vous aide à trouver le bon financement et à monter le dossier.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#situation" className={`inline-flex h-14 items-center justify-center rounded-full bg-white px-6 text-[15px] font-extrabold text-[#0B0D14] no-underline ${focusRing}`}>
              Trouver mon financement
            </a>
            <Link href={contactHref} className={`inline-flex h-14 items-center justify-center rounded-full border border-white/30 px-6 text-[15px] font-extrabold text-white no-underline ${focusRing}`}>
              Parler à un conseiller
            </Link>
          </div>
        </div>
        <article className="rounded-[32px] border border-white/10 bg-[#12151F] p-6 sm:p-8">
          <p className="text-[13px] font-extrabold text-[#C9C2FF]">{HERO_PLAN.title}</p>
          <p className="mt-1 text-[15px] text-white/70">{HERO_PLAN.context}</p>
          <p className="mt-8 text-[14px] text-white/60">{HERO_PLAN.restLabel}</p>
          <p className="mt-1 text-[56px] font-extrabold leading-none tracking-[-2px]">{HERO_PLAN.rest.label}</p>
          <p className="mt-4 inline-flex rounded-full bg-[#6BE39B] px-3 py-1.5 text-[13px] font-extrabold text-[#0B0D14]">
            {HERO_PLAN.paid}
          </p>
          <ul className="mt-8 divide-y divide-white/10">
            {HERO_PLAN.rows.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-4 py-3 text-[15px]">
                <span className="text-white/70">{row.label}</span>
                <span className="font-extrabold">{row.value}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
