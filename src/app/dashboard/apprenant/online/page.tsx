import Link from "next/link";

import {
  APPRENANT_CARD_INTERACTIVE,
  APPRENANT_CARD_KICKER,
  APPRENANT_CARD_MUTED,
  APPRENANT_CARD_TITLE,
  APPRENANT_PAGE_KICKER,
  APPRENANT_PAGE_LEAD,
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
} from "@/lib/apprenant/connect-nav";
import { EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";

export default function ApprenantOnlinePage() {
  return (
    <div className={APPRENANT_PAGE_SHELL}>
      <section className="space-y-2">
        <p className={APPRENANT_PAGE_KICKER}>Learning · Online</p>
        <h1 className={APPRENANT_PAGE_TITLE}>Catalogue en ligne</h1>
        <p className={APPRENANT_PAGE_LEAD}>
          Accédez aux formations et contenus EDGE disponibles en ligne, hors inscriptions déjà actives.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link href={EDGE_ONLINE_APP_SURFACE_PATH} className={APPRENANT_CARD_INTERACTIVE}>
          <p className={APPRENANT_CARD_KICKER}>EDGE Online</p>
          <p className={APPRENANT_CARD_TITLE}>Ouvrir le catalogue</p>
          <span className={APPRENANT_CARD_MUTED}>Formations et parcours accessibles en ligne</span>
        </Link>
        <Link href="/dashboard/apprenant/formations" className={APPRENANT_CARD_INTERACTIVE}>
          <p className={APPRENANT_CARD_KICKER}>Mes inscriptions</p>
          <p className={APPRENANT_CARD_TITLE}>Retour aux formations</p>
          <span className={APPRENANT_CARD_MUTED}>Voir ce à quoi vous êtes déjà inscrit</span>
        </Link>
      </section>
    </div>
  );
}
