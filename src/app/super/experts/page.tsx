import type { Metadata } from "next";
import { getAdminExperts } from "@/lib/queries/admin-experts";
import { ExpertsDirectory } from "./experts-directory";

export const metadata: Metadata = {
  title: "Formateurs et experts | Byound Control",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ status?: string; ajouter?: string }>;

export default async function SuperExpertsPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = await searchParams;
  const experts = await getAdminExperts(null);
  return (
    <ExpertsDirectory
      experts={experts}
      activeFilter={params?.status ?? "all"}
      startAdd={params?.ajouter === "1"}
    />
  );
}
