import { LearnerFormationsPageImpl } from "@/app/dashboard/student/learning/formations/learner-formations-page-impl";
import { getEdgeOnlineFormationsPageData } from "@/lib/queries/edge-online";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EdgeOnlineFormationsPage() {
  const data = await getEdgeOnlineFormationsPageData();
  return (
    <LearnerFormationsPageImpl data={data} orgSlug="edgelab" surfaceVariant="edgeonline" />
  );
}
