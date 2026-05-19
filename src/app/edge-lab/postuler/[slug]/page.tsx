import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostulerApplicationForm } from "@/components/edge-site/postuler/postuler-application-form";
import { getParcours } from "@/lib/parcours";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getParcours(slug);
  if (!p) return { title: "Postuler — EDGE" };
  return {
    title: `Postuler — ${p.titre} | EDGE`,
    description: `Rejoins le parcours ${p.titre}. Réponse sous 48h, sans engagement.`,
  };
}

export default async function PostulerPage({ params }: Props) {
  const { slug } = await params;
  const parcours = getParcours(slug);
  if (!parcours) notFound();

  return (
    <PostulerApplicationForm
      parcoursSlug={parcours.slug}
      parcoursTitre={parcours.titre}
      parcoursPrix={parcours.prix}
      addons={parcours.addons}
    />
  );
}
