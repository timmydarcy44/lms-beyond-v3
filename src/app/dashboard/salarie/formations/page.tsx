import { redirect } from "next/navigation";

import { SalarieFormationsBoard } from "@/components/salarie/salarie-formations-board";
import { getSession } from "@/lib/auth/session";
import { listSalarieEnterpriseFormations } from "@/lib/salarie/enterprise-formations";

export const dynamic = "force-dynamic";

export default async function SalarieFormationsPage() {
  const session = await getSession();
  if (!session?.id) {
    redirect("/login?next=/dashboard/salarie/formations");
  }

  const formations = await listSalarieEnterpriseFormations({
    userId: session.id,
    email: session.email ?? null,
  });

  return <SalarieFormationsBoard formations={formations} />;
}
