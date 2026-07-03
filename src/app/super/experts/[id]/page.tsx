import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SuperExpertCrmDetail } from "@/components/super-admin/super-expert-crm-detail";
import { getAdminExpertById } from "@/lib/queries/admin-experts";

export const metadata: Metadata = {
  title: "Fiche expert | Super Admin",
};

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function SuperExpertDetailPage({ params }: Props) {
  const { id } = await params;
  const expert = await getAdminExpertById(id);
  if (!expert) notFound();

  return (
    <div className="bg-[#f8f9fb] p-6 lg:p-8">
      <SuperExpertCrmDetail expert={expert} basePath="/super/experts" />
    </div>
  );
}
