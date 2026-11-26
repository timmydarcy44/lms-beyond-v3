import { redirect } from "next/navigation";
import { MesBilans } from "@/components/salarie/mes-bilans";
import { readLearnerPreviewContext } from "@/lib/control/learner-preview";

export const dynamic = "force-dynamic";

/**
 * Résultats individuels — exclus du mode accompagnement / preview RH.
 * Le salarié seul voit cette page.
 */
export default async function SalarieBilansPage() {
  const preview = await readLearnerPreviewContext();
  if (preview && !preview.expired) {
    redirect("/dashboard/salarie?preview_blocked=bilans");
  }

  return <MesBilans />;
}
