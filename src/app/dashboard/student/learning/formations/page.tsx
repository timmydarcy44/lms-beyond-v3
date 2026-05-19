import { getApprenantDashboardData } from "@/lib/queries/apprenant";
import { LearnerFormationsPageImpl } from "./learner-formations-page-impl";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LearnerFormationsPage() {
  const data = await getApprenantDashboardData();
  return <LearnerFormationsPageImpl data={data} />;
}
