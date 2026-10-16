import Link from "next/link";
import { ButtonPill, Section } from "@/components/home/ui";
import { Reveal } from "@/components/home/reveal";

function SoftSkillsVisual() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
      <polygon points="100,28 168,74 146,154 54,154 32,74" fill="#8B7BFF" fillOpacity="0.4" stroke="#B9AFFF" strokeWidth="2" />
      {[[100, 28], [168, 74], [146, 154], [54, 154], [32, 74]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#fff" />
      ))}
    </svg>
  );
}

function IdmcVisual() {
  return (
    <svg viewBox="0 0 220 130" className="h-full w-full" aria-hidden>
      <path d="M20 110 A90 90 0 0 1 200 110" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="14" strokeLinecap="round" />
      <path d="M20 110 A90 90 0 0 1 150 36" fill="none" stroke="#8DB8FF" strokeWidth="14" strokeLinecap="round" />
      <text x="110" y="104" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="700">Indice de maîtrise cognitive</text>
    </svg>
  );
}

function BehaviorVisual() {
  const cells = ["#5EDCC3", "rgba(255,255,255,0.15)", "rgba(255,255,255,0.15)", "rgba(94,220,195,0.5)"];
  return (
    <div className="grid h-full w-full grid-cols-2 gap-3 p-6" aria-hidden>
      {cells.map((color, index) => (
        <div key={index} className="rounded-2xl" style={{ background: color }} />
      ))}
    </div>
  );
}

const visuals = {
  "soft-skills": { bg: "#2A2452", node: <SoftSkillsVisual /> },
  idmc: { bg: "#132A4D", node: <IdmcVisual /> },
  "test-comportemental": { bg: "#0F3330", node: <BehaviorVisual /> },
} as const;

export function HomeDiagnostics({
  items,
  diagnosticsHref,
  demoHref,
}: {
  items: { slug: string; title: string; text: string; href: string }[];
  diagnosticsHref: string;
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
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-bold">Diagnostics</p>
            <h2 className="mt-5 text-[32px] font-extrabold leading-[1.05] tracking-[-1px] sm:text-[clamp(40px,5.4vw,72px)] sm:leading-[1.02] sm:tracking-[-2px]">
              Mesurez les compétences.
              <br />
              <span className="text-[#8B7BFF]">Développez les talents.</span>
            </h2>
            <p className="mt-5 max-w-xl text-[19px] leading-relaxed text-[#DADDE4]">
              Trois diagnostics scientifiques pour objectiver le potentiel avant de former, certifier et suivre la progression.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonPill href={diagnosticsHref} variant="white">Voir les diagnostics</ButtonPill>
            <ButtonPill href={demoHref} variant="outline-light">Demander une démo</ButtonPill>
          </div>
        </div>
        <div className="relative mt-12 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
          {items.map((item) => {
            const visual = visuals[item.slug as keyof typeof visuals];
            return (
              <Link key={item.slug} href={item.href} className="rounded-[32px] border border-white/8 bg-[#12141A] p-7 text-white no-underline">
                <div className="flex h-[220px] items-center justify-center overflow-hidden rounded-[24px]" style={{ background: visual.bg }}>
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
