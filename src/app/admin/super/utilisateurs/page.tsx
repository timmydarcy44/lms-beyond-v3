import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllUsers } from "@/lib/queries/super-admin";
import Link from "next/link";
import { Plus, User, Mail, Building2 } from "lucide-react";

export default async function UsersPage() {
  const users = await getAllUsers();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Utilisateurs</h1>
          <p className="text-sm text-white/60">
            Gérer tous les utilisateurs du système (formateurs, apprenants, tuteurs)
          </p>
        </div>
        <Link href="/super/utilisateurs/new">
          <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-300 hover:to-yellow-400">
            <Plus className="h-4 w-4 mr-2" />
            Créer un utilisateur
          </Button>
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex gap-3">
        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
          Tous ({users.length})
        </Button>
        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
          Formateurs ({users.filter(u => u.role === "instructor").length})
        </Button>
        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
          Apprenants ({users.filter(u => u.role === "learner").length})
        </Button>
        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
          Tuteurs ({users.filter(u => u.role === "tutor").length})
        </Button>
      </div>

      {/* Liste des utilisateurs */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Tous les utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="py-8 text-center">
              <User className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Aucun utilisateur</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-4 hover:bg-black/30 transition"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                      <User className="h-5 w-5 text-white/60" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{user.fullName || user.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-sm text-white/60">
                          <Mail className="h-3 w-3" />
                          <span>{user.email}</span>
                        </div>
                        {user.organizations.length > 0 && (
                          <div className="flex items-center gap-1 text-sm text-white/60">
                            <Building2 className="h-3 w-3" />
                            <span>{user.organizations.length} organisation{user.organizations.length > 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white capitalize">
                      {user.role === "instructor" ? "Formateur" : user.role === "learner" ? "Apprenant" : user.role === "tutor" ? "Tuteur" : user.role}
                    </span>
                    <Link href={`/super/utilisateurs/${user.id}`}>
                      <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                        Voir →
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


