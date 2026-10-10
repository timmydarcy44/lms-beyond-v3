import Image from "next/image";

import { CONTRIBUTOR_ROLE_LABELS } from "@/lib/expert/contributor-profile";
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
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#5146e5]">
          Le référentiel
        </p>
        <h2 className="mt-4 max-w-3xl text-[clamp(2.4rem,4vw,4rem)] font-semibold tracking-[-0.05em] text-[#070b1f]">
          {title}
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {people.map((person) => (
            <article key={person.id} className="rounded-[24px] bg-[#f2f3fb] p-5">
              <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-[#070b1f]">
                {person.photoUrl ? (
                  <Image src={person.photoUrl} alt="" fill sizes="112px" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl font-semibold text-white/70">
                    {person.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <h3 className="mt-5 text-base font-semibold tracking-[-0.02em] text-[#070b1f]">{person.name}</h3>
              {person.jobTitle ? <p className="mt-1 text-sm leading-snug text-black/55">{person.jobTitle}</p> : null}
              {person.roles.length > 0 ? (
                <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5146e5]">
                  {person.roles.map((role) => CONTRIBUTOR_ROLE_LABELS[role]).join(" · ")}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
