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

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-6 py-8">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">CRM / Contacts</p>
        <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
        <p className="text-sm text-gray-600">
          Vue type pipeline : filtrez par label, recherchez et ouvrez un profil.
        </p>
      </div>
      <UsersPageClient initialUsers={users} initialRole={initialRole ?? "all"} />
    </div>
  );
}
