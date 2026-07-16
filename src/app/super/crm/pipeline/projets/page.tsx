import { Suspense } from "react";
import { redirect } from "next/navigation";

import { PipelineBtobSubnav } from "@/components/super-admin/pipeline-btob-subnav";
import { isPipelinePrescripteurUser } from "@/lib/crm/pipeline-prescripteur-access";
import { getServerClient } from "@/lib/supabase/server";

import { ProjetsBoardClient } from "./projets-board-client";

export default async function CrmProjetsPage() {
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
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Projets</h1>
          <p className="text-sm text-gray-600">
            Suivez vos projets internes — glissez les cartes entre les colonnes, couleur selon le sujet.
          </p>
        </div>
        <Suspense fallback={null}>
          <PipelineBtobSubnav />
        </Suspense>
      </div>

      <ProjetsBoardClient />
    </div>
  );
}
