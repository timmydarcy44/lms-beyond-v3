import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { CompanyDashboardElite } from "@/components/beyond-connect/company-dashboard-elite";

export default async function CompanyTalentsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/beyond-connect/login?next=/dashboard/entreprise/talents");
  }

  return <CompanyDashboardElite userId={session.id} />;
}
