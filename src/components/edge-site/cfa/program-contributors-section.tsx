import Image from "next/image";

import type { ProgramContributor } from "@/lib/expert/program-contributors";

export function ProgramContributorsSection({
  people,
  title = "Ils ont co-créé le programme.",
}: {
  people: ProgramContributor[];
  title?: string;
}) {
  if (people.length === 0) return null;

  return (
    <section className="bg-[#070b1f] py-20 text-white sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8c86ff]">
          Le référentiel
        </p>
        <h2 className="mt-4 max-w-3xl text-[clamp(2.4rem,4vw,4rem)] font-semibold tracking-[-0.05em] text-white">
          {title}
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {people.map((person) => (
            <article key={person.id} className="relative aspect-[3/4] overflow-hidden rounded-[28px] bg-[#111]">
              {person.photoUrl ? (
                <Image src={person.photoUrl} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center bg-[#161616] text-6xl font-semibold text-white/30">
                  {person.name.slice(0, 1)}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-white">{person.name}</h3>
                {person.jobTitle ? <p className="mt-1 text-sm leading-snug text-white/85">{person.jobTitle}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
