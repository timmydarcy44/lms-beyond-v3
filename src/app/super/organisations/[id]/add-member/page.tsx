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
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgDetails = await getOrganizationFullDetails(id);

  if (!orgDetails) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/super/organisations/${id}/edit`}>
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Ajouter un Membre</h1>
          <p className="text-sm text-gray-600">Ajoutez un nouveau membre à l'organisation "{orgDetails?.name || "..."}"</p>
        </div>
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Nouveau membre</CardTitle>
          <CardDescription>Email, nom, rôle.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddMemberForm organizationId={id} organizationName={orgDetails.name} />
        </CardContent>
      </Card>
    </div>
  );
}

