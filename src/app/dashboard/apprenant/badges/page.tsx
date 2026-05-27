import { ApprenantOpenBadgesSection } from "@/components/apprenant/apprenant-open-badges-section";
import { ApprenantWalletBadgesGrid } from "@/components/apprenant/apprenant-wallet-badges-grid";
import { WalletPortfolioCinematicTransition } from "@/components/apprenant/wallet-portfolio-cinematic-transition";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";
import {
  APPRENANT_PAGE_KICKER,
  APPRENANT_PAGE_LEAD,
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
} from "@/lib/apprenant/connect-nav";

export const dynamic = "force-dynamic";

export default async function DashboardApprenantWalletPage() {
  const data = await getApprenantDashboardData();
  const earnedOpenBadges = data.earnedOpenBadges ?? [];
  const visibleOpenBadges = data.visibleOpenBadges ?? [];

  return (
    <WalletPortfolioCinematicTransition>
      <div className={APPRENANT_PAGE_SHELL}>
        <section className="space-y-2">
          <p className={APPRENANT_PAGE_KICKER}>Wallet</p>
          <h1 className={APPRENANT_PAGE_TITLE}>Mes Open Badges obtenus</h1>
          <p className={APPRENANT_PAGE_LEAD}>
            Retrouve ici tes badges EDGE validés. Partage-les sur LinkedIn en un clic avec un message
            pré-rédigé.
          </p>
        </section>

        <ApprenantWalletBadgesGrid badges={earnedOpenBadges} />

        {visibleOpenBadges.length > 0 ? (
          <section className="space-y-4 pt-4">
            <div className="space-y-1">
              <p className={APPRENANT_PAGE_KICKER}>À obtenir</p>
              <h2 className="text-lg font-medium text-white">Badges disponibles</h2>
            </div>
            <ApprenantOpenBadgesSection badges={visibleOpenBadges} />
          </section>
        ) : null}
      </div>
    </WalletPortfolioCinematicTransition>
  );
}
