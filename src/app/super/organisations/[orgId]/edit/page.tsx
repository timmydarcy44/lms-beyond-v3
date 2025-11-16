import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getOrganizationFullDetails } from "@/lib/queries/super-admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditOrganizationForm } from "@/components/super-admin/edit-organization-form";
import { QuickActionsPanel } from "@/components/super-admin/quick-actions-panel";

export default async function EditOrganizationPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const orgDetails = await getOrganizationFullDetails(orgId);

  if (!orgDetails) {
    notFound();
  }

  return (
    <div className="flex gap-0 min-h-screen">
      {/* Sidebar Actions Rapides - Style Apple */}
      <aside className="hidden lg:block w-80 bg-gray-50 border-r border-gray-200">
        <div className="sticky top-0 p-6 h-screen overflow-y-auto">
          <QuickActionsPanel organizationId={orgId} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 px-8 py-8 max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href={`/super/organisations/${orgId}`}>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Modifier l'Organisation</h1>
            <p className="text-sm text-gray-600">
              Gérez les informations, les membres et le logo de l'organisation
            </p>
          </div>
        </div>

        {orgDetails ? (
          <EditOrganizationForm organization={orgDetails} />
        ) : (
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-gray-600">Organisation non trouvée</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

