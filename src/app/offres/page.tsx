import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { OfferBoard, OfferSearchBar } from "@/components/offres/offer-board";
import { listPublicOffers } from "@/lib/offres/public-offers";
import { getServiceRoleClient } from "@/lib/supabase/server";

const manrope = Manrope({ subsets: ["latin"] });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Offres d'emploi — Byound",
  description: "Des offres d'entreprises qui recrutent avec Byound. Le nom de l'entreprise reste masqué jusqu'à l'entretien.",
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function OffresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; ville?: string | string[] }>;
}) {
  const params = await searchParams;
  const db = getServiceRoleClient();
  const offers = db ? await listPublicOffers(db) : [];
  const alternance = offers.filter((offer) => /alternance|apprentissage/i.test(offer.contractType)).length;

  return (
    <EdgePremiumShell overlayNav={false} navChrome="dark" showTopBar={false}>
      <div className={manrope.className}>
        <header className="bg-[#070C1C] px-5 pb-14 pt-16 text-white sm:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
              <span className="h-2 w-2 rounded-full bg-[#6E5BFF]" />
              {offers.length} offre{offers.length > 1 ? "s" : ""} active{offers.length > 1 ? "s" : ""} · dont {alternance} en alternance
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl font-extrabold tracking-[-0.045em] sm:text-6xl">
              Trouvez votre poste. <span className="text-[#C7BEFF]">Et votre formation avec.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65">
              Des offres d&apos;entreprises qui recrutent avec Byound. En alternance, postulez au poste et au cursus en une seule candidature.
            </p>
            <OfferSearchBar offers={offers} query={one(params.q)} city={one(params.ville)} />
          </div>
        </header>
        <OfferBoard offers={offers} query={one(params.q)} city={one(params.ville)} />
      </div>
    </EdgePremiumShell>
  );
}
