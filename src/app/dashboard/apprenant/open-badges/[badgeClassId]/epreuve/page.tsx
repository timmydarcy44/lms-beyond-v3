import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeSequentialAssessmentFlow } from "@/components/apprenant/badge-sequential-assessment-flow";
import { resolveEarnerContextFromSession } from "@/lib/auth/earner-session";
import {
  learnerMustRestartBadgeAssessment,
  resetLearnerBadgeAttempt,
} from "@/lib/openbadges/badge-earner-attempt";
import { getLearnerBadgePresentation } from "@/lib/openbadges/learner-badge-presentation";
import { getOpenBadgeClassByIdOnly } from "@/lib/openbadges/open-badges-table-store";
import { getPlaygroundMaxAttempts } from "@/lib/openbadges/badge-method-config";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ badgeClassId: string }> };

export default async function ApprenantOpenBadgeEpreuvePage({ params }: PageProps) {
  const { badgeClassId } = await params;
  const presentationHref = `/dashboard/apprenant/open-badges/${badgeClassId}`;

  const ctx = await resolveEarnerContextFromSession();
  if (!ctx) {
    redirect("/login?from=connect");
  }

  const badge = await getLearnerBadgePresentation(badgeClassId, ctx.userId, ctx.orgIds);
  if (!badge) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#030303] px-6 text-center text-white">
        <p className="text-lg">Ce badge n&apos;est pas disponible.</p>
        <Link href="/dashboard/apprenant" className="mt-4 text-[#FF3B30] hover:underline">
          Retour au dashboard
        </Link>
      </div>
    );
  }

  if (!badge.eligible) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#030303] px-6 text-center text-white">
        <p className="text-lg">Formation requise avant de commencer l&apos;épreuve.</p>
        <Link href={presentationHref} className="mt-4 text-[#FF3B30] hover:underline">
          Retour
        </Link>
      </div>
    );
  }

  if (badge.methodConfigs.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#030303] px-6 text-center text-white">
        <p className="text-lg">Aucune épreuve configurée pour ce badge.</p>
        <Link href={presentationHref} className="mt-4 text-[#FF3B30] hover:underline">
          Retour
        </Link>
      </div>
    );
  }

  const rawRow = await getOpenBadgeClassByIdOnly(badgeClassId);
  const evaluationConfig =
    rawRow && typeof rawRow === "object"
      ? ((rawRow as Record<string, unknown>).evaluationConfig ??
        (rawRow as Record<string, unknown>).evaluation_config)
      : null;

  if (learnerMustRestartBadgeAssessment(evaluationConfig, ctx.userId)) {
    await resetLearnerBadgeAttempt(badgeClassId, ctx.userId);
  }

  const playgroundConfig = badge.methodConfigs.find((c) => c.methodId === "playground");

  return (
    <BadgeSequentialAssessmentFlow
      badgeClassId={badgeClassId}
      presentationHref={presentationHref}
      initialAuth={{
        userId: ctx.userId,
        orgId: ctx.orgId,
        role: "EARNER",
      }}
      initialConfig={{
        id: badge.id,
        name: badge.name,
        methodConfigs: badge.methodConfigs,
        playgroundAttemptsUsed: 0,
        playgroundMaxAttempts: playgroundConfig
          ? getPlaygroundMaxAttempts(playgroundConfig)
          : null,
      }}
    />
  );
}
