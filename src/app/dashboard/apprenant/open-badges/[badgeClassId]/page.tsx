import Link from "next/link";
import { redirect } from "next/navigation";
import { OpenBadgePresentationView } from "@/components/apprenant/open-badge-presentation-view";
import { resolveEarnerContextFromSession } from "@/lib/auth/earner-session";
import { getLearnerBadgePresentation } from "@/lib/openbadges/learner-badge-presentation";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ badgeClassId: string }> };

export default async function ApprenantOpenBadgePresentationPage({ params }: PageProps) {
  const { badgeClassId } = await params;
  const ctx = await resolveEarnerContextFromSession();
  if (!ctx) {
    redirect("/login?from=connect");
  }

  const badge = await getLearnerBadgePresentation(badgeClassId, ctx.userId, ctx.orgIds);
  if (!badge) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-[#030303] px-6 text-center text-white">
        <p className="text-lg">Ce badge n&apos;est pas disponible.</p>
        <Link href="/dashboard/apprenant" className="mt-4 text-[#FF3B30] hover:underline">
          Retour au dashboard
        </Link>
      </div>
    );
  }

  return <OpenBadgePresentationView badge={badge} />;
}
