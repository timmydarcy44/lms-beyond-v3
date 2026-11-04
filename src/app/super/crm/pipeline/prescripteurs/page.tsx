import { redirect } from "next/navigation";

import { isPipelinePrescripteurUser } from "@/lib/crm/pipeline-prescripteur-access";
import { getServerClient } from "@/lib/supabase/server";

import { PrescripteursBoardClient } from "./prescripteurs-board-client";

export default async function CrmPrescripteursPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const userEmail = user?.email?.trim().toLowerCase() ?? null;

  if (!isPipelinePrescripteurUser(userEmail)) {
    redirect("/super/crm/pipeline");
  }

  return (
    <div className="space-y-6 px-3 py-6 sm:px-6 sm:py-8">
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Prescripteurs</h1>
          <p className="text-sm text-gray-600">
            Suivez vos contacts prescripteurs — prénom, entreprise, contact et prochaine action.
          </p>
        </div>
      </div>

      <PrescripteursBoardClient currentUserEmail={userEmail} />
    </div>
  );
}
