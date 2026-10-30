import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Manrope } from "next/font/google";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { OfferDetail } from "@/components/offres/public-offer";
import { getSession } from "@/lib/auth/session";
import { loadOfferCompatibility } from "@/lib/offres/compatibility";
import { getPublicOffer } from "@/lib/offres/public-offers";
import { resolveGeneratedMetadata } from "@/lib/seo/resolve-generated";
import { getServiceRoleClient } from "@/lib/supabase/server";

const manrope = Manrope({ subsets: ["latin"] });

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const db = getServiceRoleClient();
  const offer = db ? await getPublicOffer(db, slug) : null;
  if (!offer) return { title: "Offre — Byound" };
  return resolveGeneratedMetadata({
    type: "job_offer",
    path: `/offres/${slug}`,
    vars: {
      intitulé: offer.title,
      contrat: offer.contractType,
      ville: offer.city,
      cursus: offer.cursus,
    },
    sourceDescription: offer.description,
  });
}

export default async function OffrePage({ params }: Params) {
  const { slug } = await params;
  const db = getServiceRoleClient();
  const offer = db ? await getPublicOffer(db, slug) : null;
  if (!offer || !db) notFound();
  const session = await getSession();
  const compatibility = await loadOfferCompatibility(db, slug, session?.id ?? null);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: offer.title,
    description: offer.description.slice(0, 500),
    employmentType: offer.contractType || undefined,
    jobLocation: offer.city
      ? { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: offer.city, addressCountry: "FR" } }
      : undefined,
    hiringOrganization: { "@type": "Organization", name: "Byound" },
  };
  return (
    <EdgePremiumShell overlayNav={false} navChrome="dark" showTopBar={false}>
      <div className={manrope.className}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <OfferDetail offer={offer} compatibility={compatibility} />
      </div>
    </EdgePremiumShell>
  );
}
