import Link from "next/link";
import { AdminExpertsView } from "@/components/admin/experts/admin-experts-view";
import { getAdminExperts } from "@/lib/queries/admin-experts";

type SearchParams = { status?: string };

export default async function AdminExpertsPage({ searchParams }: { searchParams?: SearchParams }) {
  const status = searchParams?.status ?? "all";
  const experts = await getAdminExperts(null);

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-800">
        ← Retour admin
      </Link>
      <AdminExpertsView experts={experts} activeFilter={status} />
    </div>
  );
}
