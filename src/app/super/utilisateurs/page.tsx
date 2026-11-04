import { getCrmUsers } from "@/lib/queries/super-admin";
import { UsersPageClient } from "./users-page-client";

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const initialRoleParam = params?.role;
  const initialRole = Array.isArray(initialRoleParam) ? initialRoleParam[0] : initialRoleParam;

  const users = await getCrmUsers().catch((e) => {
    console.error("[utilisateurs] getCrmUsers:", e);
    return [];
  });

  return <UsersPageClient initialUsers={users} initialRole={initialRole ?? "all"} />;
}
