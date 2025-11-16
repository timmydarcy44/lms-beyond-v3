import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getOrganizationFullDetails } from "@/lib/queries/super-admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddMemberForm } from "@/components/super-admin/add-member-form";

export default async function AddMemberPage({
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
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/super/organisations/${orgId}/edit`}>
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Ajouter un Membre</h1>
          <p className="text-sm text-gray-600">
            Ajoutez un nouveau membre à l'organisation "{orgDetails?.name || '...'}"
          </p>
        </div>
      </div>

      {orgDetails && (
        <AddMemberForm organizationId={orgId} organizationName={orgDetails.name} />
      )}
    </div>
  );
}

