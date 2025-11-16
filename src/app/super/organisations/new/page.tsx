import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateOrganizationFormWithAdmin } from "@/components/super-admin/create-organization-form-with-admin";

export default async function CreateOrganizationPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Créer une Organisation</h1>
        <p className="text-sm text-gray-600">
          Créez une nouvelle organisation et assignez des formateurs, apprenants et tuteurs
        </p>
      </div>

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Nouvelle Organisation</CardTitle>
          <CardDescription className="text-gray-600">
            Remplissez les informations ci-dessous pour créer une organisation complète
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrganizationFormWithAdmin />
        </CardContent>
      </Card>
    </div>
  );
}
