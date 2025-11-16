"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, User, Mail, Building2 } from "lucide-react";

type UserListItem = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  organizations: Array<{ id: string; name: string }>;
};

type UsersPageClientProps = {
  initialUsers: UserListItem[];
  initialRole?: string;
};

export function UsersPageClient({ initialUsers, initialRole = "all" }: UsersPageClientProps) {
  const [selectedRole, setSelectedRole] = useState<string>(initialRole);

  const filteredUsers = selectedRole === "all"
    ? initialUsers
    : initialUsers.filter((u) => u.role === selectedRole);

  const roleCounts = {
    all: initialUsers.length,
    admin: initialUsers.filter((u) => u.role === "admin").length,
    instructor: initialUsers.filter((u) => u.role === "instructor").length,
    learner: initialUsers.filter((u) => u.role === "learner").length,
    tutor: initialUsers.filter((u) => u.role === "tutor").length,
    btoc: initialUsers.filter((u) => u.role === "btoc").length,
  };

  const getLabelForRole = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateurs";
      case "instructor":
        return "Formateurs";
      case "learner":
        return "Apprenants";
      case "tutor":
        return "Tuteurs";
      case "btoc":
        return "B2C";
      default:
        return "Tous les utilisateurs";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-600">
            Gérer tous les utilisateurs du système (formateurs, apprenants, tuteurs, admins)
          </p>
        </div>
        <Link href="/super/utilisateurs/new">
          <Button className="bg-black text-white hover:bg-gray-900">
            <Plus className="h-4 w-4 mr-2" />
            Créer un utilisateur
          </Button>
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <Button
          variant={selectedRole === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedRole("all")}
          className={selectedRole === "all" ? "bg-black text-white hover:bg-gray-900" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
        >
          Tous ({roleCounts.all})
        </Button>
        <Button
          variant={selectedRole === "admin" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedRole("admin")}
          className={selectedRole === "admin" ? "bg-black text-white hover:bg-gray-900" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
        >
          Administrateurs ({roleCounts.admin})
        </Button>
        <Button
          variant={selectedRole === "instructor" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedRole("instructor")}
          className={selectedRole === "instructor" ? "bg-black text-white hover:bg-gray-900" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
        >
          Formateurs ({roleCounts.instructor})
        </Button>
        <Button
          variant={selectedRole === "learner" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedRole("learner")}
          className={selectedRole === "learner" ? "bg-black text-white hover:bg-gray-900" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
        >
          Apprenants ({roleCounts.learner})
        </Button>
        <Button
          variant={selectedRole === "tutor" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedRole("tutor")}
          className={selectedRole === "tutor" ? "bg-black text-white hover:bg-gray-900" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
        >
          Tuteurs ({roleCounts.tutor})
        </Button>
        <Button
          variant={selectedRole === "btoc" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedRole("btoc")}
          className={selectedRole === "btoc" ? "bg-black text-white hover:bg-gray-900" : "border-gray-300 text-gray-700 hover:bg-gray-50"}
        >
          B2C ({roleCounts.btoc})
        </Button>
      </div>

      {/* Liste des utilisateurs */}
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {getLabelForRole(selectedRole)} ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Aucun utilisateur</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300 hover:shadow-sm transition"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user.fullName || user.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{user.email}</span>
                        </div>
                        {user.organizations.length > 0 && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Building2 className="h-3 w-3" />
                            <span>{user.organizations.length} organisation{user.organizations.length > 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 capitalize">
                      {user.role === "instructor" ? "Formateur" : user.role === "learner" ? "Apprenant" : user.role === "admin" ? "Admin" : user.role === "tutor" ? "Tuteur" : user.role}
                    </span>
                    <Link 
                      href={`/super/utilisateurs/${user.id}`}
                      prefetch={true}
                      onClick={(e) => {
                        console.log("[users-page] Clicking on user:", user.id, user.email);
                      }}
                    >
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
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

