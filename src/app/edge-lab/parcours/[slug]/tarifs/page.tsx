import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddOnSelector } from "@/components/edge-site/add-on-selector";
import { EdgeButton } from "@/components/edge-site/edge-button";
import { EDGE_CTA_LABELS, EDGE_HREFS } from "@/lib/edge-site/constants";
import { getParcours, PARCOURS } from "@/lib/parcours";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PARCOURS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getParcours(slug);
  if (!p) return { title: "Tarifs — EDGE" };
  return {
    title: `Tarifs — ${p.titre} | EDGE`,
    description: `Tarif du parcours ${p.titre}, options et modules complémentaires.`,
    robots: { index: true, follow: true },
  };
}

export default async function ParcoursTarifsPage({ params }: Props) {
  const { slug } = await params;
  const parcours = getParcours(slug);
  if (!parcours) notFound();

  return (
    <div className="bg-white">
      <div className="border-b border-black/[0.06] px-5 py-12 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <nav className="text-[11px] text-black/30">
            <Link href={EDGE_HREFS.parcours} className="hover:text-edge-black">
              Parcours
            </Link>
            <span className="mx-2">›</span>
            <Link href={EDGE_HREFS.parcoursSlug(slug)} className="hover:text-edge-black">
              {parcours.titre}
            </Link>
            <span className="mx-2">›</span>
            <span className="text-edge-black">Tarifs</span>
          </nav>
          <h1 className="mt-8 text-[clamp(2rem,4vw,2.5rem)] font-medium tracking-[-0.02em] text-edge-black">
            Tarifs — {parcours.titre}
          </h1>
          <p className="mt-6 text-[32px] font-medium text-edge-black">
            {parcours.prix}€
            <span className="ml-2 text-[15px] font-normal text-black/40">· {parcours.duree}</span>
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-black/40">
            Tarif du parcours certifiant incluant l&apos;accompagnement, les livrables évalués et le badge{" "}
            {parcours.badge}.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <EdgeButton href={EDGE_HREFS.postuler(slug)} ariaLabel={EDGE_CTA_LABELS.apply}>
              {EDGE_CTA_LABELS.apply}
            </EdgeButton>
            <EdgeButton variant="secondary-light" href={EDGE_HREFS.parcoursSlug(slug)} ariaLabel="Retour au parcours">
              Retour au parcours
            </EdgeButton>
          </div>
        </div>
      </div>

      {parcours.addons.length > 0 ? (
        <section className="bg-edge-grey px-5 py-16 sm:px-10" aria-labelledby="tarifs-addons">
          <div className="mx-auto max-w-6xl">
            <h2 id="tarifs-addons" className="text-xl font-medium text-edge-black">
              Options et modules complémentaires
            </h2>
            <div className="mt-10">
              <AddOnSelector addons={parcours.addons} basePrice={parcours.prix} />
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
