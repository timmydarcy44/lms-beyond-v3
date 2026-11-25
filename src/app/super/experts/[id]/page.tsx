import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { SuperExpertCrmDetail } from "@/components/super-admin/super-expert-crm-detail";
import { loadEmployeeTestResults } from "@/lib/entreprise/employee-profile-diagnostics";
import { listExpertFormationProposals } from "@/lib/expert/formation-proposals";
import { getAdminExpertById } from "@/lib/queries/admin-experts";
import { fetchAuthAccessStatusForUserIds } from "@/lib/queries/learner-tracking";
import { getServiceRoleClient } from "@/lib/supabase/server";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fiche expert | Super Admin",
};

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; modele?: string }> };

export default async function SuperExpertDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const [expert, proposals] = await Promise.all([getAdminExpertById(id), listExpertFormationProposals(id)]);
  if (!expert) notFound();

  const service = getServiceRoleClient();
  const [testResults, authMap] = await Promise.all([
    service
      ? loadEmployeeTestResults(service, id)
      : Promise.resolve({
          disc: null,
          idmc_score: null,
          idmc_axes: null,
          soft_skills: [],
          updated_at: null,
          disc_at: null,
          idmc_at: null,
          soft_skills_at: null,
        }),
    service ? fetchAuthAccessStatusForUserIds(service, [id]) : Promise.resolve(new Map()),
  ]);
  const lastSignInAt = authMap.get(id)?.lastSignInAt ?? null;

  return (
    <div className={`${manrope.className} p-6 lg:p-8`}>
      <SuperExpertCrmDetail
        expert={expert}
        basePath="/super/experts"
        proposals={proposals}
        initialTab={query.tab}
        initialTemplate={query.modele}
        testResults={testResults}
        lastSignInAt={lastSignInAt}
      />
    </div>
  );
}
