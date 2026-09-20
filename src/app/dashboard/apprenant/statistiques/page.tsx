import Link from "next/link";

import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_INTERACTIVE,
  APPRENANT_CARD_KICKER,
  APPRENANT_CARD_MUTED,
  APPRENANT_CARD_TITLE,
  APPRENANT_PAGE_KICKER,
  APPRENANT_PAGE_LEAD,
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
} from "@/lib/apprenant/connect-nav";

export default function ApprenantStatistiquesPage() {
  return (
    <div className={APPRENANT_PAGE_SHELL}>
      <section className="space-y-2">
        <p className={APPRENANT_PAGE_KICKER}>Learning · Statistiques</p>
        <h1 className={APPRENANT_PAGE_TITLE}>Votre progression</h1>
        <p className={APPRENANT_PAGE_LEAD}>
          Complétion, temps d’apprentissage et résultats — une lecture claire de votre activité Learning.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { kicker: "Complétion", title: "— %", muted: "Sur les formations actives" },
          { kicker: "Temps", title: "— h", muted: "Temps d’apprentissage cumulé" },
          { kicker: "Résultats", title: "—", muted: "Validations et scores récents" },
        ].map((card) => (
          <div key={card.kicker} className={APPRENANT_CARD_BODY}>
            <p className={APPRENANT_CARD_KICKER}>{card.kicker}</p>
            <p className={APPRENANT_CARD_TITLE}>{card.title}</p>
            <p className={APPRENANT_CARD_MUTED}>{card.muted}</p>
          </div>
        ))}
      </section>

      <Link href="/dashboard/apprenant/results" className={APPRENANT_CARD_INTERACTIVE}>
        <p className={APPRENANT_CARD_KICKER}>Détail</p>
        <p className={APPRENANT_CARD_TITLE}>Voir le suivi complet</p>
        <span className={APPRENANT_CARD_MUTED}>Résultats, validations et progression LMS</span>
      </Link>
    </div>
  );
}
