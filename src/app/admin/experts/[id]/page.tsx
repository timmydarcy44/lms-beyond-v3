import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminExpertDetailView } from "@/components/admin/experts/admin-expert-detail-view";
import { getAdminExpertById } from "@/lib/queries/admin-experts";

export default async function AdminExpertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expert = await getAdminExpertById(id);
  if (!expert) notFound();

  return (
    <div className="space-y-4">
      <Link href="/admin/experts" className="text-sm text-slate-500 hover:text-slate-800">
        ← Liste des experts
      </Link>
      <AdminExpertDetailView expert={expert} />
    </div>
  );
}
