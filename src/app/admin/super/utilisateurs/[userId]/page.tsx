import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUserDetails } from "@/lib/queries/super-admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, Building2, Edit } from "lucide-react";

export default async function UserDetailsPage({
  params,
}: {
  params: { userId: string };
}) {
  const userDetails = await getUserDetails(params.userId);

  if (!userDetails) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Link href="/super/utilisateurs">
            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">
            {userDetails.fullName || userDetails.email}
          </h1>
          <p className="text-sm text-white/50">{userDetails.email}</p>
        </div>
        <Button className="border-white/20 text-white hover:bg-white/10">
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      {/* Informations */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations Personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-white/60 uppercase tracking-[0.3em] mb-1">Email</p>
              <p className="text-white flex items-center gap-2">
                <Mail className="h-4 w-4 text-white/60" />
                {userDetails.email}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/60 uppercase tracking-[0.3em] mb-1">Nom complet</p>
              <p className="text-white">{userDetails.fullName || "Non renseigné"}</p>
            </div>
            <div>
              <p className="text-xs text-white/60 uppercase tracking-[0.3em] mb-1">Rôle</p>
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white capitalize">
                {userDetails.role === "instructor" ? "Formateur" : userDetails.role === "learner" ? "Apprenant" : userDetails.role === "tutor" ? "Tuteur" : userDetails.role}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organisations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userDetails.organizations.length === 0 ? (
              <p className="text-sm text-white/60">Aucune organisation</p>
            ) : (
              <div className="space-y-2">
                {userDetails.organizations.map((org) => (
                  <Link
                    key={org.id}
                    href={`/super/organisations/${org.id}`}
                    className="block rounded-lg border border-white/10 bg-black/20 p-3 hover:bg-black/30 transition"
                  >
                    <p className="font-medium text-white">{org.name}</p>
                    <p className="text-xs text-white/60">{org.role}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


