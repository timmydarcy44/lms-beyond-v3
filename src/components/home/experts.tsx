import Image from "next/image";
import { ButtonPill, Section } from "@/components/home/ui";
import { Reveal } from "@/components/home/reveal";
import type { HomepageExpert } from "@/lib/expert/program-contributors";

export function HomeExperts({
  people,
  sportHref,
  allHref,
}: {
  people: HomepageExpert[];
  sportHref: string;
  allHref: string;
}) {
  const filieres = [...new Set(people.map((person) => person.filiere).filter(Boolean))];
  const several = filieres.length > 1;

  return (
    <Section className="bg-white">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-[#07080B]/5 px-3 py-1.5 text-[13px] font-bold text-[#07080B]">Nos experts</p>
            <h2 className="mt-5 text-[32px] font-extrabold leading-[1.05] tracking-[-1px] text-[#07080B] sm:text-[clamp(40px,5.4vw,72px)] sm:leading-[1.02] sm:tracking-[-2px]">
              Validé par ceux
              <br />
              qui pratiquent.
            </h2>
            <p className="mt-5 max-w-xl text-[19px] leading-relaxed text-[#3A3D45]">
              Nos Open Badges sont validés par des professionnels reconnus dans leur métier, pas seulement par des formateurs.
            </p>
          </div>
          <ButtonPill href={several ? allHref : sportHref} variant="dark" className="w-full sm:w-auto">
            {several ? "Voir tous nos experts →" : "Voir les experts de la filière Sport Business →"}
          </ButtonPill>
        </div>
        {people.length > 0 ? (
          <ul className="mt-10 flex snap-x gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-4">
            {people.map((person) => (
              <li key={person.id} className="w-[240px] shrink-0 snap-start md:w-auto">
                <article>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#F4F4F1]">
                    <Image
                      src={person.photoUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 280px, (min-width: 768px) 45vw, 240px"
                      className="object-cover"
                    />
                    {person.filiere ? (
                      <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-[12px] font-extrabold text-[#07080B]">
                        {person.filiere}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-4 text-[17px] font-extrabold text-[#07080B]">{person.name}</h3>
                  {person.jobTitle ? <p className="mt-1 text-[14px] text-[#6B6F7A]">{person.jobTitle}</p> : null}
                </article>
              </li>
            ))}
          </ul>
        ) : null}
      </Reveal>
    </Section>
  );
}
