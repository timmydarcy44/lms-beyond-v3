import { redirect } from "next/navigation";

import { SalarieFormationsBoard } from "@/components/salarie/salarie-formations-board";
import { getSession } from "@/lib/auth/session";
import { resolveEffectiveSalarieActor } from "@/lib/control/learner-preview";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import {
  listSalarieAssignedFormations,
  type SalarieAssignedFormation,
} from "@/lib/salarie/assigned-formations";
import { listSalarieEnterpriseFormations } from "@/lib/salarie/enterprise-formations";

export const dynamic = "force-dynamic";

export default async function SalarieFormationsPage() {
  const session = await getSession();
  if (!session?.id) {
    redirect("/login?next=/dashboard/salarie/formations");
  }

  const { userId, email } = await resolveEffectiveSalarieActor(session.id, session.email);

  let formations: SalarieAssignedFormation[];
  if (isJadeDemoEmail(email) || isJadeDemoEmail(session.email)) {
    const jade = await listSalarieEnterpriseFormations({
      userId,
      email,
    });
    formations = jade.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      href: `/dashboard/salarie/formations/positionnement/${encodeURIComponent(item.slug)}`,
      presentation: item.objectives[0] ?? null,
      meta: `${item.trainer} · ${item.date}`,
      progress: item.positioningDone ? 100 : 0,
      coverImage: null,
    }));
  } else {
    formations = await listSalarieAssignedFormations(userId, email);
  }

  return <SalarieFormationsBoard formations={formations} />;
}
