import { EDGE_LAB_MY_RESULTS_HREF, EDGE_MY_PROGRESS_HREF } from "@/lib/beyond-connect/edge-catalog";
import {
  APPRENANT_CARD_CLASS,
  APPRENANT_PAGE_KICKER,
  APPRENANT_PAGE_LEAD,
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
} from "@/lib/apprenant/connect-nav";
import Link from "next/link";

export default function DashboardApprenantResultsPage() {
  return (
    <div className={APPRENANT_PAGE_SHELL}>
      <section className="space-y-2">
        <p className={APPRENANT_PAGE_KICKER}>Mes résultats</p>
        <h1 className={APPRENANT_PAGE_TITLE}>Suivi de progression & validations</h1>
        <p className={APPRENANT_PAGE_LEAD}>
          Parcours e-learning sur cette plateforme, suivi LMS et certifications depuis Beyond Connect —
          alignés avec ce que ton établissement consulte sur ta fiche.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Link
          href={EDGE_MY_PROGRESS_HREF}
          className={`group ${APPRENANT_CARD_CLASS} flex flex-col gap-3 p-6 transition hover:border-edge-red/25`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-edge-red/85">Suivi LMS</p>
          <p className="text-lg font-semibold text-white">Ma progression</p>
          <span className="text-sm text-white/45 underline-offset-4 group-hover:text-white group-hover:underline">
            Ouvrir le catalogue
          </span>
        </Link>
        <Link
          href={EDGE_LAB_MY_RESULTS_HREF}
          className={`group ${APPRENANT_CARD_CLASS} flex flex-col gap-3 p-6 transition hover:border-edge-red/25`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-edge-red/85">Beyond Connect</p>
          <p className="text-lg font-semibold text-white">Évaluations & CV</p>
          <span className="text-sm text-white/45 underline-offset-4 group-hover:text-white group-hover:underline">
            Tests, CV et validations
          </span>
        </Link>
        <Link
          href="/dashboard/apprenant/career"
          className={`group ${APPRENANT_CARD_CLASS} flex flex-col gap-3 p-6 transition hover:border-edge-red/25`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-edge-red/85">Profil EDGE</p>
          <p className="text-lg font-semibold text-white">Missions & fiche détaillée</p>
          <span className="text-sm text-white/45 underline-offset-4 group-hover:text-white group-hover:underline">
            Ouvrir ma carrière
          </span>
        </Link>
      </section>

      <section className="rounded-3xl border border-white/[0.06] bg-[#141412] p-5 text-xs text-white/45">
        Les liens externes s’ouvrent sur Beyond Connect ou le catalogue EDGE selon ta configuration. En cas
        d’anomalie, contacte ta direction ou le support EDGE.
      </section>
    </div>
  );
}
