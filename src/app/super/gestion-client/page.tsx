import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getJessicaUsersList } from "@/lib/queries/jessica-users";
import { UsersListClient } from "./users-list-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export const revalidate = 0;

export default async function JessicaUsersPage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const users = await getJessicaUsersList();

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 
              className="text-4xl font-bold mb-2"
              style={{ color: "#2F2A25" }}
            >
              Gestion des utilisateurs
            </h1>
            <p 
              className="text-lg"
              style={{ color: "#2F2A25", opacity: 0.7 }}
            >
              Liste de tous les utilisateurs ayant créé un compte
            </p>
          </div>
          <Link href="/super/gestion-client/new">
            <Button
              className="rounded-full px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              style={{
                backgroundColor: "#C6A664",
                color: "white",
              }}
            >
              <Plus className="h-5 w-5 mr-2" />
              Créer un compte
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div 
            className="rounded-2xl border-2 p-6"
            style={{ 
              borderColor: "#E6D9C6",
              backgroundColor: "#FFFFFF",
            }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="p-3 rounded-full"
                style={{ backgroundColor: "#C6A66420" }}
              >
                <Users className="h-6 w-6" style={{ color: "#C6A664" }} />
              </div>
              <div>
                <p 
                  className="text-sm font-medium"
                  style={{ color: "#2F2A25", opacity: 0.7 }}
                >
                  Total utilisateurs
                </p>
                <p 
                  className="text-3xl font-bold"
                  style={{ color: "#2F2A25" }}
                >
                  {users.length}
                </p>
              </div>
            </div>
          </div>
          <div 
            className="rounded-2xl border-2 p-6"
            style={{ 
              borderColor: "#E6D9C6",
              backgroundColor: "#FFFFFF",
            }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="p-3 rounded-full"
                style={{ backgroundColor: "#C6A66420" }}
              >
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p 
                  className="text-sm font-medium"
                  style={{ color: "#2F2A25", opacity: 0.7 }}
                >
                  CA total
                </p>
                <p 
                  className="text-3xl font-bold"
                  style={{ color: "#C6A664" }}
                >
                  {users.reduce((sum, u) => sum + u.totalRevenue, 0).toFixed(2)}€
                </p>
              </div>
            </div>
          </div>
          <div 
            className="rounded-2xl border-2 p-6"
            style={{ 
              borderColor: "#E6D9C6",
              backgroundColor: "#FFFFFF",
            }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="p-3 rounded-full"
                style={{ backgroundColor: "#C6A66420" }}
              >
                <span className="text-2xl">🛒</span>
              </div>
              <div>
                <p 
                  className="text-sm font-medium"
                  style={{ color: "#2F2A25", opacity: 0.7 }}
                >
                  Achats totaux
                </p>
                <p 
                  className="text-3xl font-bold"
                  style={{ color: "#2F2A25" }}
                >
                  {users.reduce((sum, u) => sum + u.purchaseCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des utilisateurs */}
        <UsersListClient initialUsers={users} />
      </div>
    </div>
  );
}

