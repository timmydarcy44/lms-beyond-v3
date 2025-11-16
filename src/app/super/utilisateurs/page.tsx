import { getAllUsers } from "@/lib/queries/super-admin";
import { UsersPageClient } from "./users-page-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const initialRoleParam = params?.role;
  const initialRole = Array.isArray(initialRoleParam) ? initialRoleParam[0] : initialRoleParam;

  const users = await getAllUsers();

  return (
    <div className="space-y-8">
      {/* Header centré avec gradient */}
      <div className="flex flex-col items-center justify-center space-y-6 py-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Utilisateurs
        </h1>
        <Link href="/super/utilisateurs/new">
          <Button className="bg-black text-white hover:bg-gray-900">
            <Plus className="h-4 w-4 mr-2" />
            Créer un utilisateur
          </Button>
        </Link>
      </div>
      <UsersPageClient initialUsers={users} initialRole={initialRole ?? "all"} />
    </div>
  );
}
