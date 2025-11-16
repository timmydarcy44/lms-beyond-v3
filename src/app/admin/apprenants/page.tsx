import { AdminLearnersView } from "@/components/admin/learners/admin-learners-view";
import { getAdminLearners } from "@/lib/queries/admin";

type SearchParams = {
  success?: string;
  error?: string;
};

export default async function AdminApprenantsPage({ searchParams }: { searchParams?: SearchParams }) {
  const learners = await getAdminLearners();
  const flash = searchParams?.success
    ? {
        type: "success" as const,
        title: "Apprenant enregistré",
        message: decodeURIComponent(searchParams.success),
      }
    : searchParams?.error
      ? {
          type: "error" as const,
          title: "Erreur",
          message: decodeURIComponent(searchParams.error),
        }
      : undefined;

  return <AdminLearnersView learners={learners} flash={flash} />;
}


