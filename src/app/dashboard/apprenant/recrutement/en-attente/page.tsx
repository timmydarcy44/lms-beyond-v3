import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
  APPRENANT_CARD_MUTED,
  APPRENANT_CARD_TITLE,
  APPRENANT_PAGE_KICKER,
  APPRENANT_PAGE_LEAD,
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
} from "@/lib/apprenant/connect-nav";

export default function RecrutementEnAttentePage() {
  return (
    <div className={APPRENANT_PAGE_SHELL}>
      <section className="space-y-2">
        <p className={APPRENANT_PAGE_KICKER}>Recrutement · En attente</p>
        <h1 className={APPRENANT_PAGE_TITLE}>Candidatures & mises en relation</h1>
        <p className={APPRENANT_PAGE_LEAD}>
          Suivez ici les opportunités pour lesquelles une action est en cours auprès d’une entreprise.
        </p>
      </section>

      <div className={APPRENANT_CARD_BODY}>
        <p className={APPRENANT_CARD_KICKER}>Statut</p>
        <p className={APPRENANT_CARD_TITLE}>Aucune demande en attente</p>
        <p className={APPRENANT_CARD_MUTED}>
          Dès qu’une candidature ou une mise en relation démarre, elle apparaîtra dans cet espace.
        </p>
      </div>
    </div>
  );
}
