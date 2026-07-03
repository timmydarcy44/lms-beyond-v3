import type { Metadata } from "next";
import { AdminExpertsView } from "@/components/admin/experts/admin-experts-view";
import { getAdminExperts } from "@/lib/queries/admin-experts";

export const metadata: Metadata = {
  title: "Experts / Formateurs | Super Admin",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string }>;

export default async function SuperExpertsPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = await searchParams;
  const status = params?.status ?? "all";
  const experts = await getAdminExperts(null);

  return <AdminExpertsView experts={experts} activeFilter={status} basePath="/super/experts" />;
}
