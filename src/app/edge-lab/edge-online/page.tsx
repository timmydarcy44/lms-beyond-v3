import type { Metadata } from "next";
import Link from "next/link";

import { EdgeOnlineExperience } from "@/components/edge-lab/edge-online-experience";
import { EdgeButton } from "@/components/edge-site/edge-button";
import { EDGE_HREFS } from "@/lib/edge-site/constants";
import { EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";
import { getEdgeOnlinePublishedCourses } from "@/lib/queries/edge-online";

export const metadata: Metadata = {
  title: "EDGE Online — Le Netflix de la compétence pro",
  description:
    "Micro-formations par thématique, test d’orientation et accès streaming. 19€/mois ou 149€/an.",
};

export const dynamic = "force-dynamic";

export default async function EdgeOnlineMarketingPage() {
  const courses = await getEdgeOnlinePublishedCourses();

  return (
    <div className="bg-white">
      <section className="border-b border-black/[0.06] bg-white px-5 py-16 text-center sm:px-10 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-black/35">EDGE Online</p>
          <h1 className="mt-5 text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#1d1d1f]">
            Le Netflix de la compétence pro,
            <span className="text-edge-red"> pensé comme Apple.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[17px] leading-[1.55] text-black/45">
            12 thématiques, 80+ micro-modules. Parcourez le catalogue en streaming, affinez avec le test
            d’orientation, puis ouvrez votre espace de développement.
          </p>
          <div className="mt-10 flex flex-wrap items-baseline justify-center gap-8">
            <p className="text-[#1d1d1f]">
              <span className="text-[40px] font-semibold tracking-tight">19€</span>
              <span className="text-black/40"> / mois</span>
            </p>
            <p className="text-black/40">
              ou <span className="font-semibold text-[#1d1d1f]">149€/an</span>
              <span className="text-black/30"> (2 mois offerts)</span>
            </p>
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <EdgeButton href={EDGE_ONLINE_APP_SURFACE_PATH} ariaLabel="Ouvrir le catalogue">
              Ouvrir le catalogue
            </EdgeButton>
            <EdgeButton variant="outline-red" href={EDGE_HREFS.orientation} ariaLabel="Faire le test d’orientation">
              Faire le test
            </EdgeButton>
          </div>
          <p className="mt-8 text-[13px] text-black/35">
            Déjà abonné ?{" "}
            <Link href={EDGE_HREFS.login} className="text-[#0066cc] hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </section>

      <EdgeOnlineExperience initialCourses={courses} />
    </div>
  );
}
