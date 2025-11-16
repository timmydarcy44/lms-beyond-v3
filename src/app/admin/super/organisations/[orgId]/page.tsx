import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrganizationFullDetails } from "@/lib/queries/super-admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, UserPlus, Edit } from "lucide-react";

export default async function OrganizationDetailsPage({
  params,
}: {
  params: { orgId: string };
}) {
  const orgDetails = await getOrganizationFullDetails(params.orgId);

  if (!orgDetails) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Link href="/super/organisations">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">{orgDetails.name}</h1>
          {orgDetails.slug && (
            <p className="text-sm text-white/50 font-mono">/{orgDetails.slug}</p>
          )}
          {orgDetails.description && (
            <p className="text-sm text-white/60">{orgDetails.description}</p>
          )}
        </div>
        <Button className="border-white/20 text-white hover:bg-white/10">
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white/60 uppercase tracking-[0.3em]">
              Total Membres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{orgDetails.memberCount}</div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white/60 uppercase tracking-[0.3em]">
              Formateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{orgDetails.instructorCount}</div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white/60 uppercase tracking-[0.3em]">
              Apprenants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{orgDetails.learnerCount}</div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-white/60 uppercase tracking-[0.3em]">
              Tuteurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">{orgDetails.tutorCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Membres */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-white">Membres</CardTitle>
            <Button size="sm" className="border-white/20 text-white hover:bg-white/10">
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter un membre
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {orgDetails.members.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">Aucun membre dans cette organisation</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orgDetails.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex-1">
                    <p className="font-medium text-white">{member.fullName || member.email}</p>
                    <p className="text-sm text-white/60">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white capitalize">
                      {member.role === "instructor" ? "Formateur" : member.role === "learner" ? "Apprenant" : "Tuteur"}
                    </span>
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


