import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { SuperExpertCrmDetail } from "@/components/super-admin/super-expert-crm-detail";
import { listExpertFormationProposals } from "@/lib/expert/formation-proposals";
import { getAdminExpertById } from "@/lib/queries/admin-experts";

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

  return (
    <div className={`${manrope.className} p-6 lg:p-8`}>
      <SuperExpertCrmDetail
        expert={expert}
        basePath="/super/experts"
        proposals={proposals}
        initialTab={query.tab}
        initialTemplate={query.modele}
      />
    </div>
  );
}
