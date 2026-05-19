import type { Metadata } from "next";

import { EntrepriseContactForm } from "@/components/edge-site/entreprise-contact-form";

export const metadata: Metadata = {
  title: "Entreprises — Formez vos équipes | EDGE",
  description: "Diagnostic Beyond, parcours intra sur-mesure et catalogue multi-accès pour vos équipes.",
};

const OFFRES = [
  {
    title: "Diagnostic Beyond",
    description: "Psychométrie d'équipe, cartographie des profils et plan de montée en compétences collectives.",
  },
  {
    title: "Parcours intra sur-mesure",
    description: "Co-construction d'un parcours certifiant aligné sur vos enjeux métier et vos experts métiers.",
  },
  {
    title: "Catalogue accès multiple",
    description: "Licences EDGE Online et parcours certifiants pour vos collaborateurs, avec reporting RH.",
  },
] as const;

export default function EntreprisesPage() {
  return (
    <>
      <section className="bg-edge-black px-5 py-20 sm:px-10 sm:py-[80px]">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white">
            Formez vos équipes autrement.
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-[1.7] text-white/45">
            Diagnostic comportemental, parcours sur-mesure et déploiement à l&apos;échelle de vos équipes en
            Normandie et en France.
          </p>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-10 sm:py-[80px]" aria-labelledby="offres-b2b">
        <div className="mx-auto max-w-6xl">
          <h2 id="offres-b2b" className="sr-only">
            Offres entreprises
          </h2>
          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            {OFFRES.map((o) => (
              <article key={o.title}>
                <h3 className="text-[18px] font-medium text-edge-black">{o.title}</h3>
                <p className="mt-4 text-[14px] leading-relaxed text-black/40">{o.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-edge-grey px-5 py-20 sm:px-10 sm:py-[80px]" aria-labelledby="contact-entreprise">
        <div className="mx-auto max-w-xl">
          <h2 id="contact-entreprise" className="text-[clamp(1.75rem,3vw,2rem)] font-medium text-edge-black">
            Demande de devis
          </h2>
          <EntrepriseContactForm />
        </div>
      </section>
    </>
  );
}
