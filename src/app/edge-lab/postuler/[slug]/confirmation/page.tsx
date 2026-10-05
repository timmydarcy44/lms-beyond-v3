import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostulerConfirmation } from "@/components/edge-site/postuler/postuler-confirmation";
import { getParcours } from "@/lib/parcours";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getParcours(slug);
  if (!p) return { title: "Postulation reçue — Byound" };
  return {
    title: `Postulation reçue — ${p.titre} | Byound`,
    robots: { index: false, follow: false },
  };
}

export default async function PostulerConfirmationPage({ params }: Props) {
  const { slug } = await params;
  if (!getParcours(slug)) notFound();

  return <PostulerConfirmation />;
}
