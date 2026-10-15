import { SalarieDashboardClient } from "@/components/salarie/salarie-dashboard-client";
import { JadeDemoHome } from "@/components/demo/jade-demo-home";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SalarieDashboardPage() {
  const session = await getSession();
  if (isJadeDemoEmail(session?.email)) {
    return <JadeDemoHome space="salarie" />;
  }
  return <SalarieDashboardClient />;
}
