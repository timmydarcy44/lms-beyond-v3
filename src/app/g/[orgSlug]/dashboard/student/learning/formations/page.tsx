import { getApprenantDashboardData } from "@/lib/queries/apprenant";
import { LearnerFormationsPageImpl } from "@/app/dashboard/student/learning/formations/learner-formations-page-impl";

export default async function GalaxyLearnerFormationsPage(props: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await props.params;
  const data = await getApprenantDashboardData(orgSlug);
  return <LearnerFormationsPageImpl data={data} orgSlug={orgSlug} />;
}

