import { Section } from "@/components/home/ui";
import { Reveal } from "@/components/home/reveal";

const STEPS = [
  {
    n: "01",
    title: "Apprendre",
    text: "Des parcours personnalisés par l'IA, en présentiel, à distance ou en alternance.",
    dark: false,
  },
  {
    n: "02",
    title: "Pratiquer",
    text: "Mises en situation, jeux de rôle et projets réels avec des experts métier.",
    dark: false,
  },
  {
    n: "03",
    title: "Prouver",
    text: "Chaque compétence validée devient un Open Badge vérifiable, partageable sur LinkedIn.",
    dark: true,
  },
  {
    n: "04",
    title: "Évoluer",
    text: "Un profil de compétences qui suit la personne : nouveau poste, mobilité, évolution.",
    dark: false,
  },
] as const;

export function HomeMethod() {
  return (
    <Section className="bg-white">
      <Reveal>
        <h2 className="max-w-4xl text-[32px] font-extrabold leading-[1.05] tracking-[-1px] sm:text-[clamp(40px,5.4vw,72px)] sm:leading-[1.02] sm:tracking-[-2px]">
          Apprendre. Pratiquer.
          <br />
          Prouver. Évoluer.
        </h2>
        <p className="mt-5 max-w-xl text-[19px] text-[#3A3D45]">
          Technologie, preuves et résultats. Pas du marketing formation.
        </p>
        <div className="mt-10 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))]">
          {STEPS.map((step) => (
            <article
              key={step.n}
              className={step.dark ? "min-h-[280px] rounded-[28px] bg-[#0B1124] p-7 text-white" : "min-h-[280px] rounded-[28px] bg-[#F4F4F1] p-7 text-[#07080B]"}
            >
              <p className={step.dark ? "text-[56px] font-extrabold leading-none text-[#F2CF6B]" : "text-[56px] font-extrabold leading-none text-[#6E5BFF]"}>
                {step.n}
              </p>
              <h3 className="mt-6 text-2xl font-extrabold">{step.title}</h3>
              <p className={step.dark ? "mt-3 text-base leading-relaxed text-[#DADDE4]" : "mt-3 text-base leading-relaxed text-[#3A3D45]"}>
                {step.text}
              </p>
            </article>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
