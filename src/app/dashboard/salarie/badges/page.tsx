import { redirect } from "next/navigation";

import { ApprenantOpenBadgesSection } from "@/components/apprenant/apprenant-open-badges-section";
import { ApprenantWalletBadgesGrid } from "@/components/apprenant/apprenant-wallet-badges-grid";
import { getSession } from "@/lib/auth/session";
import { resolveEffectiveSalarieUserId } from "@/lib/control/learner-preview";
import {
  getLearnerEarnedOpenBadges,
  getLearnerVisibleOpenBadges,
} from "@/lib/openbadges/learner-visible-badges";
import {
  SALARIE_PAGE_KICKER,
  SALARIE_PAGE_LEAD,
  SALARIE_PAGE_SHELL,
  SALARIE_PAGE_TITLE,
} from "@/lib/salarie/connect-nav";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SalarieWalletPage() {
  const session = await getSession();
  if (!session?.id) {
    redirect("/login?next=/dashboard/salarie/badges");
  }

  const { userId } = await resolveEffectiveSalarieUserId(session.id);
  const db = getServiceRoleClient();
  const { data: profile } = db
    ? await db.from("profiles").select("company_id, school_id").eq("id", userId).maybeSingle()
    : { data: null };

  const orgId =
    (profile?.company_id as string | null) ?? (profile?.school_id as string | null) ?? null;
  const orgIds = orgId ? [orgId] : [];

  let earnedOpenBadges: Awaited<ReturnType<typeof getLearnerEarnedOpenBadges>> = [];
  let visibleOpenBadges: Awaited<ReturnType<typeof getLearnerVisibleOpenBadges>> = [];
  try {
    [earnedOpenBadges, visibleOpenBadges] = await Promise.all([
      getLearnerEarnedOpenBadges(userId),
      getLearnerVisibleOpenBadges(userId, orgId, orgIds),
    ]);
  } catch (err) {
    console.error("[salarie/badges] wallet load:", err);
    try {
      earnedOpenBadges = await getLearnerEarnedOpenBadges(userId);
    } catch (earnedErr) {
      console.error("[salarie/badges] earned load:", earnedErr);
    }
  }

  return (
    <div className={SALARIE_PAGE_SHELL}>
      <section className="space-y-2">
        <p className={SALARIE_PAGE_KICKER}>Wallet</p>
        <h1 className={SALARIE_PAGE_TITLE}>Mes Open Badges</h1>
        <p className={SALARIE_PAGE_LEAD}>
          Retrouvez vos badges Byound validés et découvrez ceux que vous pouvez obtenir.
        </p>
      </section>

      <ApprenantWalletBadgesGrid badges={earnedOpenBadges} />

      {visibleOpenBadges.length > 0 ? (
        <section className="space-y-4 pt-4">
          <div className="space-y-1">
            <p className={SALARIE_PAGE_KICKER}>À obtenir</p>
            <h2 className="text-lg font-medium text-white">Badges disponibles</h2>
          </div>
          <ApprenantOpenBadgesSection badges={visibleOpenBadges} />
        </section>
      ) : null}
    </div>
  );
}
