import type { Metadata } from "next";
import { isCareDemoEmail, isCareDemoExpertId } from "@/lib/care/demo-profiles";
import { getAdminExperts } from "@/lib/queries/admin-experts";
import { ExpertsDirectory } from "@/app/super/experts/experts-directory";

export const metadata: Metadata = {
  title: "Coach Care | Byound Control",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; ajouter?: string }>;

export default async function SuperCareCoachPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = await searchParams;
  const experts = (await getAdminExperts(null)).filter(
    (expert) =>
      expert.is_care_expert === true ||
      isCareDemoExpertId(expert.id) ||
      isCareDemoEmail(expert.email),
  );
  return (
    <ExpertsDirectory
      experts={experts}
      activeFilter={params?.status ?? "all"}
      startAdd={params?.ajouter === "1"}
      title="Coach"
      subtitle={`${experts.length} coach${experts.length > 1 ? "s" : ""} Byound Care`}
      hideExtras
      basePath="/super/care/coach"
    />
  );
}
