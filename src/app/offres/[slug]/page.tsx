import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Manrope } from "next/font/google";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { OfferDetail } from "@/components/offres/public-offer";
import { getPublicOffer } from "@/lib/offres/public-offers";
import { getServiceRoleClient } from "@/lib/supabase/server";

const manrope = Manrope({ subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const db = getServiceRoleClient();
  const offer = db ? await getPublicOffer(db, slug) : null;
  if (!offer) return { title: "Offre — Byound" };
  const place = offer.city ? ` à ${offer.city}` : "";
  return {
    title: `${offer.title}${place} — Byound`,
    description: `${offer.title}, ${offer.sector}. Entreprise partenaire. Candidature via Byound.`,
  };
}

export default async function OffrePage({ params }: Params) {
  const { slug } = await params;
  const db = getServiceRoleClient();
  const offer = db ? await getPublicOffer(db, slug) : null;
  if (!offer) notFound();
  return (
    <EdgePremiumShell overlayNav={false} navChrome="dark" showTopBar={false}>
      <div className={manrope.className}>
        <OfferDetail offer={offer} />
      </div>
    </EdgePremiumShell>
  );
}
