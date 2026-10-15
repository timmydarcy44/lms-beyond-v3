import { PraticienHomePage } from "@/components/praticien/pages/home-page";
import { JadeDemoHome } from "@/components/demo/jade-demo-home";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { getSession } from "@/lib/auth/session";

export default async function PraticienDashboardPage() {
  const session = await getSession();
  if (isJadeDemoEmail(session?.email)) {
    return <JadeDemoHome space="praticien" />;
  }
  return <PraticienHomePage />;
}
