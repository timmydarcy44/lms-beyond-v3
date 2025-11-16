import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllOrganizations } from "@/lib/queries/super-admin";
import Link from "next/link";
import { Plus, Building2, Users, Calendar } from "lucide-react";
import Image from "next/image";
import { getOrganizationLogo } from "@/lib/queries/super-admin";
import { OrganizationCard } from "@/components/super-admin/organization-card";

export default async function OrganizationsPage() {
  const organizations = await getAllOrganizations();
  
  // Récupérer les logos pour chaque organisation
  const organizationsWithLogos = await Promise.all(
    organizations.map(async (org) => {
      const logo = await getOrganizationLogo(org.id);
      return { ...org, logo };
    })
  );

  return (
    <div className="space-y-8">
      {/* Header centré avec gradient */}
      <div className="flex flex-col items-center justify-center space-y-6 py-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Organisations
        </h1>
        <Link href="/super/organisations/new">
          <Button className="bg-black text-white hover:bg-gray-900">
            <Plus className="h-4 w-4 mr-2" />
            Créer une organisation
          </Button>
        </Link>
      </div>

      {organizationsWithLogos.length === 0 ? (
        <Card className="border-gray-200 bg-gradient-to-br from-white to-gray-50/30 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Aucune organisation</p>
            <p className="text-sm text-gray-600 mb-6">
              Créez votre première organisation pour commencer
            </p>
            <Link href="/super/organisations/new">
              <Button className="bg-black text-white hover:bg-gray-900">
                <Plus className="h-4 w-4 mr-2" />
                Créer une organisation
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizationsWithLogos.map((org) => (
            <OrganizationCard key={org.id} organization={org} />
          ))}
        </div>
      )}
    </div>
  );
}
