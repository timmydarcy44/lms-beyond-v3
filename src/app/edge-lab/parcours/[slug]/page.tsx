import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ParcoursNarrativePage } from "@/components/edge-site/parcours-narrative-page";
import { ParcoursPageContent } from "@/components/edge-site/parcours-page-content";
import { getParcours, isParcoursNarrative, PARCOURS } from "@/lib/parcours";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return PARCOURS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getParcours(slug);
  if (!p) return { title: "Parcours — EDGE" };
  return {
    title: `${p.titreMarketing ?? p.titre} — Parcours certifiant EDGE`,
    description: `${p.duree} · ${p.familleLabel}. ${p.promesse ?? p.description}`,
  };
}

export default async function ParcoursSlugPage({ params }: Props) {
  const { slug } = await params;
  const parcours = getParcours(slug);
  if (!parcours) notFound();

  if (isParcoursNarrative(parcours)) {
    return <ParcoursNarrativePage parcours={parcours} />;
  }

  return <ParcoursPageContent parcours={parcours} />;
}
