import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateOrganizationForm } from "@/components/super-admin/create-organization-form";

export default async function CreateOrganizationPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Créer une Organisation</h1>
        <p className="text-sm text-white/60">
          Créez une nouvelle organisation et assignez des formateurs, apprenants et tuteurs
        </p>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Nouvelle Organisation</CardTitle>
          <CardDescription className="text-white/60">
            Remplissez les informations ci-dessous pour créer une organisation complète
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrganizationForm />
        </CardContent>
      </Card>
    </div>
  );
}




