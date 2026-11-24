import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateUserForm } from "@/components/super-admin/create-user-form";

export default async function CreateUserPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; audience?: string }>;
}) {
  const params = await searchParams;
  const audience = String(params?.audience ?? "").trim().toLowerCase();
  const roleParam = String(params?.role ?? "").trim();
  const defaultRole =
    roleParam === "admin"
      ? "admin"
      : audience === "btoc" || roleParam === "btoc" || roleParam === "PARTICULIER"
        ? "btoc"
        : roleParam || undefined;
  const isBtoc = defaultRole === "btoc";

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          {defaultRole === "admin"
            ? "Créer un Administrateur"
            : isBtoc
              ? "Nouvelle inscription Client BtoC"
              : "Créer un Utilisateur"}
        </h1>
        <p className="text-sm text-gray-600">
          {isBtoc
            ? "Créez un particulier : email, téléphone, prénom, nom. Un email lui permettra de créer son mot de passe."
            : "Créez un contact avec email, téléphone, prénom, nom et rôle. Un email lui permettra de créer son mot de passe de façon autonome. Il apparaîtra ensuite dans la liste CRM Contacts."}
        </p>
      </div>

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            {isBtoc ? "Nouveau client BtoC" : "Nouvel Utilisateur"}
          </CardTitle>
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

