import { redirect } from "next/navigation";

import { SalarieWalletBadges } from "@/components/salarie/salarie-wallet-badges";
import { getSession } from "@/lib/auth/session";
import { resolveEffectiveSalarieUserId } from "@/lib/control/learner-preview";
import { getLearnerEarnedOpenBadges } from "@/lib/openbadges/learner-visible-badges";
import {
  SALARIE_PAGE_KICKER,
  SALARIE_PAGE_LEAD,
  SALARIE_PAGE_SHELL,
  SALARIE_PAGE_TITLE,
} from "@/lib/salarie/connect-nav";

export const dynamic = "force-dynamic";

export default async function SalarieWalletPage() {
  const session = await getSession();
  if (!session?.id) {
    redirect("/login?next=/dashboard/salarie/badges");
  }

  const { userId } = await resolveEffectiveSalarieUserId(session.id);

  let earnedOpenBadges: Awaited<ReturnType<typeof getLearnerEarnedOpenBadges>> = [];
  try {
    earnedOpenBadges = await getLearnerEarnedOpenBadges(userId);
  } catch (err) {
    console.error("[salarie/badges] earned load:", err);
  }

  return (
    <div className={SALARIE_PAGE_SHELL}>
      <section className="space-y-2 text-center sm:text-left">
        <p className={SALARIE_PAGE_KICKER}>Wallet</p>
        <h1 className={SALARIE_PAGE_TITLE}>Mes Open Badges</h1>
        <p className={SALARIE_PAGE_LEAD}>
          Votre badge Byound et le partage LinkedIn.
        </p>
      </section>

      <SalarieWalletBadges badges={earnedOpenBadges} />
    </div>
  );
}
