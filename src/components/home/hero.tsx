import Image from "next/image";
import { Award } from "lucide-react";
import { ButtonPill } from "@/components/home/ui";

export function HomeHero({
  schoolHref,
  businessHref,
  imageSrc,
}: {
  schoolHref: string;
  businessHref: string;
  imageSrc: string;
}) {

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#070C1C] text-white lg:min-h-[720px]">
      <div className="absolute inset-0">
        <Image
          src={imageSrc}
          alt="Étudiante Byound souriante, carnet Byound à la main"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_22%] lg:object-[30%_30%]"
        />
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            background:
              "linear-gradient(90deg, #070C1C 0%, #070C1CF0 26%, #070C1CA6 44%, #070C1C1A 64%, transparent 78%)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 lg:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(7,12,28,0.28) 0%, rgba(7,12,28,0.04) 18%, rgba(7,12,28,0.08) 40%, rgba(7,12,28,0.78) 68%, #070C1C 100%)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-40 lg:block"
          style={{ background: "linear-gradient(0deg, #070C1C, transparent)" }}
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1240px] items-end px-6 pb-8 pt-24 lg:min-h-[720px] lg:items-center lg:py-28">
        <div className="flex max-w-[600px] flex-col gap-6 lg:gap-7">
        <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-bold">
          <span className="text-[#6BE39B]" aria-hidden>●</span>
          École et entreprises · Caen
        </p>
        <h1 className="text-[36px] font-extrabold leading-[1.02] tracking-[-1.2px] sm:text-[52px] sm:tracking-[-2px] lg:text-[clamp(52px,6.6vw,92px)] lg:leading-[0.98] lg:tracking-[-3px]">
          Vos compétences.
          <br />
          <span className="text-[#A99BFF]">Votre prochaine étape.</span>
        </h1>
        <p className="max-w-[480px] text-[19px] leading-relaxed text-[#DADDE4]">
          Une école pour construire votre avenir. Des solutions pour développer vos équipes.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonPill href={schoolHref} variant="white" className="w-full sm:w-auto">
            Découvrir l&apos;école →
          </ButtonPill>
          <ButtonPill href={businessHref} variant="outline-light" className="w-full sm:w-auto">
            Solutions entreprises
          </ButtonPill>
        </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-[clamp(16px,4vw,64px)] top-[120px] hidden w-[230px] rounded-[22px] bg-white p-4 text-[#07080B] shadow-[0_24px_60px_rgba(0,0,0,0.35)] lg:block" aria-hidden>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2A2312]">
          <Award className="text-[#F2CF6B]" strokeWidth={2} />
        </div>
        <p className="mt-4 text-[11px] font-bold text-[#6B6F7A]">Open Badge obtenu</p>
        <p className="text-[15px] font-extrabold">Négociation</p>
      </div>
      <div className="pointer-events-none absolute bottom-[110px] right-[clamp(40px,6vw,96px)] hidden w-[220px] rounded-[24px] border border-white/12 bg-[rgba(12,13,18,0.9)] p-4 text-white shadow-[0_24px_60px_rgba(0,0,0,0.35)] lg:block" aria-hidden>
        <p className="text-[11px] font-bold text-[#B5BAC6]">Progression · CCP1</p>
        <p className="mt-2 text-[44px] font-extrabold leading-none">72 %</p>
        <div className="mt-4 h-[5px] overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-[72%] rounded-full bg-[#8B7BFF]" />
        </div>
      </div>
    </section>
  );
}
