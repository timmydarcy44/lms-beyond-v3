import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProgrammeLandingPage } from "@/components/jessica-contentin/programme-landing-page";
import { getProgramme, programmeSlugs } from "@/lib/jessica-contentin/programmes-catalog";
import { getProgrammeLandingContent } from "@/lib/jessica-contentin/programme-landing-content";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return programmeSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await params;
  const slug = typeof resolved?.slug === "string" ? decodeURIComponent(resolved.slug).trim() : "";
  const p = getProgramme(slug);
  const landing = getProgrammeLandingContent(slug);
  if (!p) return { title: "Programme" };
  return {
    title: p.seoTitle,
    description: landing?.heroSubtitle ?? p.tag,
    openGraph: {
      title: p.seoTitle,
      description: landing?.heroSubtitle ?? p.tag,
      images: [{ url: p.heroImageUrl }],
    },
  };
}

export default async function ProgrammePresentationPage({ params }: Props) {
  const resolved = await params;
  const slug = typeof resolved?.slug === "string" ? decodeURIComponent(resolved.slug).trim() : "";
  if (!slug) notFound();

  const p = getProgramme(slug);
  const landing = getProgrammeLandingContent(slug);
  if (!p || !landing) notFound();

  return <ProgrammeLandingPage content={landing} />;
}
