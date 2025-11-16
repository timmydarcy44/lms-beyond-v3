import { AdminGroupsView } from "@/components/admin/groups/admin-groups-view";
import { getAdminGroups } from "@/lib/queries/admin";

type SearchParams = {
  success?: string;
  error?: string;
};

export default async function AdminGroupesPage({ searchParams }: { searchParams?: SearchParams }) {
  const groups = await getAdminGroups();
  const flash = searchParams?.success
    ? {
        type: "success" as const,
        title: "Groupe créé",
        message: decodeURIComponent(searchParams.success),
      }
    : searchParams?.error
      ? {
          type: "error" as const,
          title: "Erreur",
          message: decodeURIComponent(searchParams.error),
        }
      : undefined;

  return <AdminGroupsView groups={groups} flash={flash} />;
}


