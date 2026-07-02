import { notFound } from "next/navigation";
import {
  BusinessPlaceholderRoute,
  BUSINESS_PLACEHOLDER_PAGES,
  businessPlaceholderMetadata,
  type BusinessPlaceholderSlug,
} from "@/lib/edge-site/business-placeholder-pages";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(BUSINESS_PLACEHOLDER_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  if (!(slug in BUSINESS_PLACEHOLDER_PAGES)) {
    return { title: "EDGE Business" };
  }
  return businessPlaceholderMetadata(slug as BusinessPlaceholderSlug);
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (!(slug in BUSINESS_PLACEHOLDER_PAGES)) {
    notFound();
  }
  return <BusinessPlaceholderRoute slug={slug as BusinessPlaceholderSlug} />;
}
