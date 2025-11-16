import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateUserForm } from "@/components/super-admin/create-user-form";

export default async function CreateUserPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Créer un Utilisateur</h1>
        <p className="text-sm text-white/60">
          Créez un nouvel utilisateur (formateur, apprenant ou tuteur) et assignez-le à une organisation
        </p>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Nouvel Utilisateur</CardTitle>
          <CardDescription className="text-white/60">
            Remplissez les informations ci-dessous pour créer un utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>
    </div>
  );
}



