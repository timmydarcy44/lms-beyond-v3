import { EDGE_LAB_MY_RESULTS_HREF, EDGE_MY_PROGRESS_HREF } from "@/lib/beyond-connect/edge-catalog";
import { APPRENANT_CARD_CLASS } from "@/lib/apprenant/connect-nav";
import Link from "next/link";

export default function DashboardApprenantResultsPage() {
  return (
    <div className="space-y-6 text-[#e6e9ef] md:space-y-8 md:rounded-[34px] md:border md:border-[#283247] md:bg-[#0b0e14]/90 md:p-8 md:px-10 md:py-10 lg:px-12 md:backdrop-blur">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#cbb6ff]/80">
          Mes résultats
        </p>
        <h1 className="text-[clamp(1.45rem,2.5vw,1.85rem)] font-semibold text-white md:text-[clamp(1.95rem,3vw,2.4rem)]">
          Suivi de progression & validations
        </h1>
        <p className="max-w-2xl text-sm text-[#9aa8c9]">
          Parcours e-learning sur cette plateforme, suivi LMS et certifications
          depuis Beyond Connect — alignés avec ce que ton établissement consulte sur ta fiche.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Link
          href={EDGE_MY_PROGRESS_HREF}
          className={`group ${APPRENANT_CARD_CLASS} flex flex-col gap-3 transition hover:border-white/[0.12]`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a78bfa]">
            Suivi LMS
          </p>
          <p className="text-lg font-semibold text-white">Ma progression</p>
          <span className="text-sm text-[#a5b8e4] underline-offset-4 group-hover:text-white group-hover:underline">
            Ouvrir le catalogue
          </span>
        </Link>
        <Link
          href={EDGE_LAB_MY_RESULTS_HREF}
          className={`group ${APPRENANT_CARD_CLASS} flex flex-col gap-3 transition hover:border-white/[0.12]`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a78bfa]">
            Beyond Connect
          </p>
          <p className="text-lg font-semibold text-white">Évaluations & CV</p>
          <span className="text-sm text-[#a5b8e4] underline-offset-4 group-hover:text-white group-hover:underline">
            Tests, CV et validations
          </span>
        </Link>
        <Link
          href="/dashboard/apprenant/career"
          className={`group ${APPRENANT_CARD_CLASS} flex flex-col gap-3 transition hover:border-white/[0.12]`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a78bfa]">
            Profil EDGE
          </p>
          <p className="text-lg font-semibold text-white">Missions & fiche détaillée</p>
          <span className="text-sm text-[#a5b8e4] underline-offset-4 group-hover:text-white group-hover:underline">
            Ouvrir ma carrière
          </span>
        </Link>
      </section>

      <section className="rounded-3xl border border-[#293244] bg-[#101622]/90 p-5 text-xs text-[#9aa8c9]">
        Les liens externes s’ouvrent sur Beyond Connect ou le catalogue EDGE selon ta configuration. En cas
        d’anomalie, contacte ta direction ou le support EDGE.
      </section>
    </div>
  );
}
