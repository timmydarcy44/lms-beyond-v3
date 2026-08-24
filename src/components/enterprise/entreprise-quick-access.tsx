"use client";

import Image from "next/image";
import Link from "next/link";

const CARDS = [
  {
    href: "/dashboard/entreprise/offres/creer",
    title: "Créer une offre",
    description: "Publier un poste",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
    imagePosition: "center",
  },
  {
    href: "/dashboard/entreprise/salaries?invite=1",
    title: "Inviter un collaborateur",
    description: "Ajouter un salarié",
    image:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=900&q=80",
    imagePosition: "center",
  },
  {
    href: "/dashboard/entreprise/formations/creer",
    title: "Créer une formation",
    description: "Parcours interne",
    image: "/edge-lab/cover_management.png",
    imagePosition: "center",
  },
  {
    href: "/dashboard/entreprise/formations/demander",
    title: "Demander une formation",
    description: "Catalogue EDGE",
    image: "/edge-lab/programme-ia.png",
    imagePosition: "center",
  },
  {
    href: "/dashboard/entreprise/messages",
    title: "Messages RH",
    description: "Échanges rapides",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80",
    imagePosition: "top",
  },
  {
    href: "/dashboard/entreprise/metiers",
    title: "Fiches métiers",
    description: "Compétences cibles",
    image: "/edge-lab/cover_analyse_comportementale.png",
    imagePosition: "center",
  },
] as const;

export function EntrepriseQuickAccess() {
  return (
    <section>
      <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.18em] text-gray-400">
        Actions rapides
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group relative block aspect-[5/4] overflow-hidden rounded-[20px] shadow-[0_10px_28px_rgba(0,0,0,0.1)] transition duration-400 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
          >
            <Image
              src={card.image}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 16vw"
              className="object-cover transition duration-500 ease-out group-hover:scale-[1.05]"
              style={{ objectPosition: card.imagePosition }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
              <h3 className="text-[15px] font-semibold leading-tight tracking-tight text-white [font-family:-apple-system,'SF_Pro_Display',BlinkMacSystemFont,sans-serif]">
                {card.title}
              </h3>
              <p className="mt-1 line-clamp-1 text-[11px] text-white/70">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
