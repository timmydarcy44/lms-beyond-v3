import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/home/ui";
import { Reveal } from "@/components/home/reveal";
import { HOME_UNIVERSE_PHOTOS } from "@/content/home";

const SCHOOL_GRADIENT = "linear-gradient(180deg, transparent 30%, #07080BB3 62%, #07080BF2 100%)";
const BUSINESS_GRADIENT = "linear-gradient(180deg, transparent 30%, #3B2DA8B3 62%, #2A1F7AF2 100%)";

function Segments({ filled }: { filled: number }) {
  return (
    <span className="flex flex-1 gap-1">
      {Array.from({ length: 6 }, (_, index) => (
        <span key={index} className={index < filled ? "h-1.5 flex-1 rounded-full bg-white" : "h-1.5 flex-1 rounded-full bg-white/20"} />
      ))}
    </span>
  );
}

function UniverseCard({
  href,
  image,
  imageClassName = "",
  gradient,
  pill,
  widget,
  title,
  text,
  tags,
  cta,
}: {
  href: string;
  image: { src: string; alt: string };
  imageClassName?: string;
  gradient: string;
  pill: string;
  widget: React.ReactNode;
  title: string;
  text: string;
  tags: { label: string; featured?: boolean }[];
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex min-h-[520px] overflow-hidden rounded-[36px] text-white no-underline min-[760px]:min-h-[640px]"
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(min-width: 760px) 50vw, 100vw"
        className={`object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${imageClassName}`}
      />
      <span className="pointer-events-none absolute inset-0" style={{ background: gradient }} aria-hidden />
      <span className="relative flex w-full flex-col p-7 sm:p-10">
        <span className="flex flex-wrap items-start justify-between gap-3">
          <span className="inline-flex min-h-9 items-center rounded-full bg-white px-3.5 text-[13px] font-extrabold text-[#07080B]">{pill}</span>
          {widget}
        </span>
        <span className="mt-auto max-w-xl pt-16">
          <span className="block text-[36px] font-extrabold leading-[1.05] tracking-[-1px] sm:text-[clamp(36px,4vw,52px)]">{title}</span>
          <span className="mt-4 block text-[18px] leading-relaxed text-white/90">{text}</span>
          <span className="mt-5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.label}
                className={
                  tag.featured
                    ? "inline-flex min-h-9 items-center rounded-full bg-white px-3.5 text-[13px] font-bold text-[#07080B]"
                    : "inline-flex min-h-9 items-center rounded-full bg-white/15 px-3.5 text-[13px] font-bold text-white"
                }
              >
                {tag.label}
              </span>
            ))}
          </span>
          <span className="mt-6 inline-flex items-center gap-2 text-[15px] font-extrabold">
            {cta}
            <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none" size={18} strokeWidth={2} aria-hidden />
          </span>
        </span>
      </span>
    </Link>
  );
}

export function HomeUniverses({
  more,
  schoolHref,
  businessHref,
}: {
  more: number;
  schoolHref: string;
  businessHref: string;
}) {
  return (
    <Section className="bg-[#F4F4F1]">
      <Reveal>
        <div className="flex flex-col gap-6 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between">
          <h2 className="text-[32px] font-extrabold leading-[1.05] tracking-[-1px] text-[#07080B] sm:text-[clamp(40px,5.4vw,72px)] sm:leading-[1.02] sm:tracking-[-2px]">
            Deux univers.
            <br />
            Une même ambition.
          </h2>
          <p className="max-w-[380px] text-[18px] leading-relaxed text-[#3A3D45]">
            Que vous construisiez votre parcours ou celui de votre équipe, on part de la même chose : ce que chacun sait vraiment faire.
          </p>
        </div>
        <div className="mt-10 grid gap-5 min-[760px]:grid-cols-2">
          <UniverseCard
            href={schoolHref}
            image={HOME_UNIVERSE_PHOTOS.school}
            gradient={SCHOOL_GRADIENT}
            pill="Byound School"
            title="Construisez votre avenir."
            text="École, alternance et reconversion à Caen. Un titre reconnu, une spécialité métier et des compétences prouvées."
            cta="Explorer l'école"
            tags={[
              { label: "AI Business", featured: true },
              { label: "Business Sport" },
              { label: "Real Estate" },
              ...(more > 0 ? [{ label: `+ ${more} formations` }] : []),
            ]}
            widget={
              <span className="flex max-w-full items-center gap-3 rounded-[18px] border border-white/[0.12] bg-[#0B0C10]/85 p-3" aria-hidden>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#6E5BFF] text-[15px] font-extrabold">1·3</span>
                <span>
                  <span className="block text-[13px] font-extrabold">Alternance</span>
                  <span className="block text-[12px] leading-snug text-white/70">1 semaine à l&apos;école, 3 en entreprise</span>
                </span>
              </span>
            }
          />
          <UniverseCard
            href={businessHref}
            image={HOME_UNIVERSE_PHOTOS.business}
            imageClassName="object-[center_22%]"
            gradient={BUSINESS_GRADIENT}
            pill="Byound Business"
            title="Faites progresser vos équipes."
            text="Formations, tests et suivi des compétences. Vous voyez qui progresse, sur quoi, et ce qui reste à travailler."
            cta="Explorer Business"
            tags={[
              { label: "Formations", featured: true },
              { label: "Tests" },
              { label: "Open Badges" },
              { label: "Recrutement" },
            ]}
            widget={
              <span className="w-full max-w-[250px] rounded-[18px] border border-white/[0.12] bg-[#0B0C10]/85 p-3" aria-hidden>
                <span className="block text-[12px] font-extrabold">Équipe commerciale · 12 pers.</span>
                <span className="mt-2 flex items-center gap-2">
                  <span className="text-[12px] font-bold">Négociation</span>
                  <Segments filled={4} />
                  <span className="text-[12px] font-extrabold">4/6</span>
                </span>
                <span className="mt-2 block text-[12px] font-extrabold text-[#8FF2C4]">+3 Open Badges ce trimestre</span>
              </span>
            }
          />
        </div>
      </Reveal>
    </Section>
  );
}
