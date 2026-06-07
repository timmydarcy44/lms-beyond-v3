import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ParcoursGuideDetail } from "@/components/jessica-contentin/parcours-guide-detail";
import { getParcoursGuide, PARCOURS_GUIDES } from "@/lib/jessica-contentin/parcours-guide-catalog";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return PARCOURS_GUIDES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getParcoursGuide(decodeURIComponent(slug));
  if (!p) return { title: "Parcours guidé" };
  return {
    title: `${p.title} | Jessica Contentin`,
    description: p.subtitle,
    openGraph: { title: p.title, description: p.subtitle, images: [{ url: p.imageUrl }] },
  };
}

export default async function ParcoursGuideDetailPage({ params }: Props) {
  const { slug } = await params;
  const parcours = getParcoursGuide(decodeURIComponent(slug));
  if (!parcours) notFound();
  return <ParcoursGuideDetail parcours={parcours} />;
}
