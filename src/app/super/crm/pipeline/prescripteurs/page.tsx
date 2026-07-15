import { Suspense } from "react";
import { redirect } from "next/navigation";

import { PipelineBtobSubnav } from "@/components/super-admin/pipeline-btob-subnav";
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
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">CRM / Pipeline BTOB</p>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Prescripteurs</h1>
          <p className="text-sm text-gray-600">
            Suivez vos contacts prescripteurs — prénom, entreprise, contact et prochaine action.
          </p>
        </div>
        <Suspense fallback={null}>
          <PipelineBtobSubnav />
        </Suspense>
      </div>

      <PrescripteursBoardClient currentUserEmail={userEmail} />
    </div>
  );
}
