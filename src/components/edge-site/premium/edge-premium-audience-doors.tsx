"use client";

import Link from "next/link";
import { ArrowRight, Briefcase, GraduationCap, UserRound } from "lucide-react";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";

export function EdgePremiumAudienceDoors() {
  const { routes, links } = useEdgePremiumConfig();

  const doors = [
    {
      icon: GraduationCap,
      title: "Je cherche une alternance",
      description:
        "Découvrez les parcours en alternance et suivez l’ouverture du CFA Byound — rentrée 2027.",
      status: "À venir — CFA 2027",
      cta: "Découvrir l'alternance",
      href: routes.alternance,
    },
    {
      icon: Briefcase,
      title: "Je développe mon équipe",
      description:
        "Recrutez, formez et suivez les compétences dans votre entreprise avec Byound Business.",
      status: "Disponible",
      cta: "Découvrir Byound Business",
      href: links.business,
    },
    {
      icon: UserRound,
      title: "Je veux me former",
      description:
        "Bootcamps, formations courtes et futurs parcours en ligne pour votre prochain projet.",
      status: "Partiellement disponible",
      cta: "Espace particuliers",
      href: links.particulier,
    },
  ] as const;

  return (
    <section className="bg-edge-cream py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-black/40">
          Pour qui ?
        </p>
        <h2 className="mt-4 max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-edge-black-deep">
          Trois portes d’entrée. Une même ambition : vos compétences.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-black/50">
          Que vous soyez futur alternant, responsable d’équipe ou en reconversion, Byound vous
          aide à apprendre, progresser et rendre vos acquis visibles.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {doors.map((door) => (
            <article
              key={door.title}
              className="group flex flex-col rounded-[24px] border border-black/[0.06] bg-white p-7 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(5,5,5,0.06)] sm:p-8"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.08] bg-black/[0.03] text-edge-black-deep">
                <door.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-black/40">
                {door.status}
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-edge-black-deep">
                {door.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-black/55">{door.description}</p>
              <Link
                href={door.href}
                className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-edge-black-deep transition-opacity hover:opacity-70"
              >
                {door.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
