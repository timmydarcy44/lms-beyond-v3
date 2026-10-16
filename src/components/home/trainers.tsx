import { ButtonPill, Section } from "@/components/home/ui";
import { Reveal } from "@/components/home/reveal";

export function HomeTrainers({ href }: { href: string }) {
  return (
    <Section className="bg-white">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-8 rounded-[36px] bg-[#F4F4F1] p-[clamp(28px,4vw,48px)]">
          <div className="max-w-2xl">
            <h2 className="text-[clamp(28px,3.2vw,40px)] font-extrabold leading-tight tracking-[-1px]">
              Vous êtes formateur ou expert métier ?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#3A3D45]">
              Rejoignez l&apos;écosystème Byound et intervenez sur des parcours conçus pour développer les compétences qui font la différence.
            </p>
          </div>
          <ButtonPill href={href} variant="dark">
            Devenir formateur →
          </ButtonPill>
        </div>
      </Reveal>
    </Section>
  );
}
