import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BadgeSequentialAssessmentFlow } from "@/components/apprenant/badge-sequential-assessment-flow";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getPlaygroundMaxAttempts, resolveMethodConfigsForBadge } from "@/lib/openbadges/badge-method-config";
import { getOpenBadgeClassByIdOnly } from "@/lib/openbadges/open-badges-table-store";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export default async function SuperBadgeTrialPage({ params }: RouteParams) {
  const { id } = await params;
  if (!(await isSuperAdmin())) redirect("/unauthorized");

  const supabase = await getServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!data.user?.id) redirect("/login");

  const badge = await getOpenBadgeClassByIdOnly(id);
  if (!badge) notFound();

  const methodConfigs = resolveMethodConfigsForBadge(badge);
  const editHref = `/super/open-badges/badgeclasses/${id}/edit`;
  const name = String(badge.name ?? "Open Badge");

  if (methodConfigs.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-lg">Ajoutez au moins une modalité, enregistrez le brouillon, puis relancez l&apos;essai.</p>
        <Link href={editHref} className="mt-4 inline-block text-sm underline">
          Retour à l&apos;édition
        </Link>
      </div>
    );
  }

  const playgroundConfig = methodConfigs.find((method) => method.methodId === "playground");

  return (
    <BadgeSequentialAssessmentFlow
      badgeClassId={id}
      presentationHref={editHref}
      preview
      initialAuth={{
        userId: data.user.id,
        orgId: String(badge.orgId ?? ""),
        role: "SUPER_ADMIN",
      }}
      initialConfig={{
        id,
        name,
        methodConfigs,
        playgroundAttemptsUsed: 0,
        playgroundMaxAttempts: playgroundConfig ? getPlaygroundMaxAttempts(playgroundConfig) : null,
      }}
    />
  );
}
