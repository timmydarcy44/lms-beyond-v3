import { ArrowRight } from "lucide-react";
import { BigTile, Pill, Section } from "@/components/home/ui";
import { Reveal } from "@/components/home/reveal";
import type { HomeFormation } from "@/content/home";

export function HomeUniverses({
  formations,
  more,
  schoolHref,
  businessHref,
}: {
  formations: HomeFormation[];
  more: number;
  schoolHref: string;
  businessHref: string;
}) {
  return (
    <Section className="bg-[#F4F4F1]">
      <Reveal>
        <h2 className="text-[clamp(40px,5.4vw,72px)] font-extrabold leading-[1.02] tracking-[-2px] text-[#07080B]">
          Deux univers.
          <br />
          Une même ambition.
        </h2>
        <div className="mt-10 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
          <BigTile href={schoolHref} className="bg-[#0B1124]">
            <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#6E5BFF]/12" aria-hidden />
            <Pill>Byound School</Pill>
            <p className="mt-6 text-[clamp(36px,4vw,52px)] font-extrabold leading-[1.05] tracking-[-1.5px]">
              Construisez votre avenir.
            </p>
            <p className="mt-4 max-w-md text-lg text-[#B5BAC6]">École, alternance et reconversion à Caen.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {formations.map((item) => (
                <span key={item.label} className={item.featured ? "inline-flex min-h-9 items-center rounded-full bg-white px-3.5 text-[13px] font-bold text-[#07080B]" : "inline-flex min-h-9 items-center rounded-full bg-white/10 px-3.5 text-[13px] font-bold"}>
                  {item.label}
                </span>
              ))}
              {more > 0 ? (
                <span className="inline-flex min-h-9 items-center rounded-full bg-white/10 px-3.5 text-[13px] font-bold">
                  + {more} formations
                </span>
              ) : null}
            </div>
            <span className="mt-auto inline-flex items-center gap-2 pt-10 text-[15px] font-extrabold">
              Explorer l&apos;école
              <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" size={18} strokeWidth={2} aria-hidden />
            </span>
          </BigTile>

          <BigTile href={businessHref} className="bg-[#6E5BFF]">
            <span className="pointer-events-none absolute -right-10 bottom-10 h-48 w-48 rounded-full bg-white/12" aria-hidden />
            <span className="inline-flex min-h-9 items-center rounded-full bg-white/15 px-3.5 text-[13px] font-bold">Byound Business</span>
            <p className="mt-6 text-[clamp(36px,4vw,52px)] font-extrabold leading-[1.05] tracking-[-1.5px]">
              Faites progresser vos équipes.
            </p>
            <p className="mt-4 max-w-md text-lg text-white">Formations, diagnostics et suivi des compétences.</p>
            <div className="mt-6 rounded-[24px] bg-white/15 p-5" aria-hidden>
              <p className="text-sm font-bold">Équipe commerciale</p>
              {[
                ["Écoute", "78%"],
                ["Négociation", "56%"],
                ["Leadership", "40%"],
              ].map(([label, width]) => (
                <div key={label} className="mt-3">
                  <div className="mb-1 flex justify-between text-[13px] font-bold">
                    <span>{label}</span>
                    <span>{width}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full rounded-full bg-white" style={{ width }} />
                  </div>
                </div>
              ))}
            </div>
            <span className="mt-auto inline-flex items-center gap-2 pt-10 text-[15px] font-extrabold">
              Explorer Business
              <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" size={18} strokeWidth={2} aria-hidden />
            </span>
          </BigTile>
        </div>
      </Reveal>
    </Section>
  );
}
