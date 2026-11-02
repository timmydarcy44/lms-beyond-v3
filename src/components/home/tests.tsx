import Link from "next/link";
import { BehaviorPreview, IdmcPreview, SoftSkillsPreview } from "@/components/home/test-previews";
import { ButtonPill, Section } from "@/components/home/ui";
import { Reveal } from "@/components/home/reveal";

const visuals = {
  "soft-skills": { bg: "#2A2452", node: <SoftSkillsPreview /> },
  idmc: { bg: "#132A4D", node: <IdmcPreview /> },
  "test-comportemental": { bg: "#0F3330", node: <BehaviorPreview /> },
} as const;

export function HomeTests({
  items,
  testsHref,
  demoHref,
}: {
  items: { slug: string; title: string; text: string; href: string }[];
  testsHref: string;
  demoHref: string;
}) {
  return (
    <Section className="relative overflow-hidden bg-[#070C1C] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(50% 60% at 50% 0%, rgba(110,91,255,0.25), transparent 70%)" }}
        aria-hidden
      />
      <Reveal>
        <div className="relative flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-bold">Tests</p>
            <h2 className="mt-5 text-[32px] font-extrabold leading-[1.05] tracking-[-1px] sm:text-[clamp(40px,5.4vw,72px)] sm:leading-[1.02] sm:tracking-[-2px]">
              Mesurez les compétences.
              <br />
              <span className="text-[#8B7BFF]">Développez les talents.</span>
            </h2>
            <p className="mt-5 max-w-xl text-[19px] leading-relaxed text-[#DADDE4]">
              Trois tests scientifiques pour objectiver le potentiel avant de former, certifier et suivre la progression.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonPill href={testsHref} variant="white">Découvrir les tests</ButtonPill>
            <ButtonPill href={demoHref} variant="outline-light">Demander une démo</ButtonPill>
          </div>
        </div>
        <div className="relative mt-12 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          {items.map((item) => {
            const visual = visuals[item.slug as keyof typeof visuals];
            return (
              <Link key={item.slug} href={item.href} className="rounded-[32px] border border-white/8 bg-[#12141A] p-7 text-white no-underline">
                <div className="overflow-hidden rounded-[24px]" style={{ background: visual.bg }}>
                  {visual.node}
                </div>
                <h3 className="mt-6 text-2xl font-extrabold">{item.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-[#B5BAC6]">{item.text}</p>
                <p className="mt-5 text-[15px] font-extrabold">Découvrir →</p>
              </Link>
            );
          })}
        </div>
      </Reveal>
    </Section>
  );
}
