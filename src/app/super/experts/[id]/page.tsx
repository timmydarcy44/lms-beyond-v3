import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminExpertDetailView } from "@/components/admin/experts/admin-expert-detail-view";
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
    <div className="space-y-6 p-6 lg:p-8">
      <Link href="/super/experts" className="text-sm text-slate-500 hover:text-slate-800">
        ← Retour aux experts
      </Link>
      <AdminExpertDetailView expert={expert} basePath="/super/experts" />
    </div>
  );
}
