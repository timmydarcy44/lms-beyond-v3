import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, GraduationCap, UserRound } from "lucide-react";

import type { EdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";

type Door = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  icon: typeof GraduationCap;
};

type Props = {
  routes: EdgeMarketingRoutes;
};

export function RejoindreChooserPage({ routes }: Props) {
  const doors: Door[] = [
    {
      id: "ecole",
      eyebrow: "Jeune · famille",
      title: "Byound School",
      body: "Bachelor en alternance, candidature en ligne, accompagnement jusqu’à l’entreprise.",
      cta: "Candidater à l’école",
      href: routes.ecoleCandidater,
      icon: GraduationCap,
    },
    {
      id: "entreprise",
      eyebrow: "Entreprise · RH",
      title: "Byound Business",
      body: "Former vos équipes, piloter les compétences, essayer la plateforme.",
      cta: "Créer un compte entreprise",
      href: routes.entrepriseSignup,
      icon: BriefcaseBusiness,
    },
    {
      id: "particulier",
      eyebrow: "Particulier",
      title: "Mon espace",
      body: "Profil, tests et formations pour développer votre employabilité.",
      cta: "Créer mon espace",
      href: routes.particulier,
      icon: UserRound,
    },
  ];

  return (
    <div className="min-h-[70vh] bg-[#070b1f] px-5 pb-24 pt-28 text-white sm:px-8 lg:px-10 lg:pt-36">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">Rejoindre</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Qui êtes-vous ?
        </h1>
        <p className="mt-4 max-w-xl text-base text-white/65">
          Trois portes d’entrée distinctes — pour éviter d’atterrir sur le mauvais formulaire.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {doors.map((door) => {
            const Icon = door.icon;
            return (
              <Link
                key={door.id}
                href={door.href}
                className="group flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/25 hover:bg-white/[0.06]"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <Icon size={20} aria-hidden />
                </span>
                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-white/45">
                  {door.eyebrow}
                </p>
                <h2 className="mt-2 text-xl font-semibold">{door.title}</h2>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/65">{door.body}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  {door.cta}
                  <ArrowRight
                    size={16}
                    className="transition group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Link>
            );
          })}
        </div>

        <p className="mt-10 text-sm text-white/45">
          Déjà inscrit ?{" "}
          <Link href={routes.login} className="font-medium text-white underline-offset-4 hover:underline">
            Connexion
          </Link>
          {" · "}
          <Link href={routes.ecole} className="font-medium text-white underline-offset-4 hover:underline">
            Découvrir l’école
          </Link>
        </p>
      </div>
    </div>
  );
}
