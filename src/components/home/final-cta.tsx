import { ButtonPill, Section } from "@/components/home/ui";
import { Reveal } from "@/components/home/reveal";

export function HomeFinalCta({ contactHref, demoHref }: { contactHref: string; demoHref: string }) {
  return (
    <Section className="bg-white">
      <Reveal>
        <div className="relative overflow-hidden rounded-[40px] bg-[#6E5BFF] px-6 py-16 text-center text-white sm:px-12 sm:py-20">
          <span className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/12" aria-hidden />
          <span className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-black/12" aria-hidden />
          <h2 className="relative mx-auto max-w-[860px] text-[clamp(40px,5.4vw,72px)] font-extrabold leading-[1.02] tracking-[-2px]">
            Prêt à développer votre potentiel ou celui de vos équipes ?
          </h2>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonPill href={contactHref} variant="white">Nous contacter</ButtonPill>
            <ButtonPill href={demoHref} variant="translucent">Demander une démo</ButtonPill>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
