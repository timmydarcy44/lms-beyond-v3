import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateUserForm } from "@/components/super-admin/create-user-form";

export default async function CreateUserPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const defaultRole = params?.role === "admin" ? "admin" : undefined;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          {defaultRole === "admin" ? "Créer un Administrateur" : "Créer un Utilisateur"}
        </h1>
        <p className="text-sm text-gray-600">
          {defaultRole === "admin"
            ? "Créez un nouvel administrateur d'organisation"
            : "Créez un nouvel utilisateur (formateur, apprenant ou tuteur) et assignez-le à une organisation"}
        </p>
      </div>

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Nouvel Utilisateur</CardTitle>
          <CardDescription className="text-gray-600">
            Remplissez les informations ci-dessous pour créer un utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm defaultRole={defaultRole} />
        </CardContent>
      </Card>
    </div>
  );
}

