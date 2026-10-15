import { EnterpriseDashboardV2 } from "@/components/enterprise/enterprise-dashboard-v2";
import { JadeDemoHome } from "@/components/demo/jade-demo-home";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { getSession } from "@/lib/auth/session";

export default async function EntrepriseDashboardPage() {
  const session = await getSession();
  if (isJadeDemoEmail(session?.email)) {
    return <JadeDemoHome space="entreprise" />;
  }
  return <EnterpriseDashboardV2 />;
}
