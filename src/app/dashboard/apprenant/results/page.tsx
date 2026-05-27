import { EDGE_LAB_MY_RESULTS_HREF, EDGE_MY_PROGRESS_HREF } from "@/lib/beyond-connect/edge-catalog";
import {
  APPRENANT_CARD_INTERACTIVE,
  APPRENANT_CARD_KICKER,
  APPRENANT_CARD_MUTED,
  APPRENANT_CARD_NOTE,
  APPRENANT_CARD_TITLE,
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
        <Link href={EDGE_MY_PROGRESS_HREF} className={APPRENANT_CARD_INTERACTIVE}>
          <p className={APPRENANT_CARD_KICKER}>Suivi LMS</p>
          <p className={APPRENANT_CARD_TITLE}>Ma progression</p>
          <span className={APPRENANT_CARD_MUTED}>Ouvrir le catalogue</span>
        </Link>
        <Link href={EDGE_LAB_MY_RESULTS_HREF} className={APPRENANT_CARD_INTERACTIVE}>
          <p className={APPRENANT_CARD_KICKER}>Beyond Connect</p>
          <p className={APPRENANT_CARD_TITLE}>Évaluations & CV</p>
          <span className={APPRENANT_CARD_MUTED}>Tests, CV et validations</span>
        </Link>
        <Link href="/dashboard/apprenant/profil" className={APPRENANT_CARD_INTERACTIVE}>
          <p className={APPRENANT_CARD_KICKER}>Profil EDGE</p>
          <p className={APPRENANT_CARD_TITLE}>Ma fiche & page publique</p>
          <span className={APPRENANT_CARD_MUTED}>Compléter et partager</span>
        </Link>
      </section>

      <section className={APPRENANT_CARD_NOTE}>
        Les liens externes s’ouvrent sur Beyond Connect ou le catalogue EDGE selon ta configuration. En cas
        d’anomalie, contacte ta direction ou le support EDGE.
      </section>
    </div>
  );
}
