import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllOrganizations } from "@/lib/queries/super-admin";
import Link from "next/link";
import { Plus, Building2, Users, Calendar } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function OrganizationsPage() {
  const organizations = await getAllOrganizations();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white">Organisations</h1>
          <p className="text-sm text-white/60">
            Gérer toutes les organisations et leurs membres
          </p>
        </div>
        <Link href="/super/organisations/new">
          <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-300 hover:to-yellow-400">
            <Plus className="h-4 w-4 mr-2" />
            Créer une organisation
          </Button>
        </Link>
      </div>

      {organizations.length === 0 ? (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-white/20 mb-4" />
            <p className="text-lg font-medium text-white mb-2">Aucune organisation</p>
            <p className="text-sm text-white/60 mb-6">
              Créez votre première organisation pour commencer
            </p>
            <Link href="/super/organisations/new">
              <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-300 hover:to-yellow-400">
                <Plus className="h-4 w-4 mr-2" />
                Créer une organisation
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link key={org.id} href={`/super/organisations/${org.id}`}>
              <Card className="h-full border-white/10 bg-white/5 transition hover:bg-white/10 hover:border-white/20 cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-white mb-1">
                        {org.name}
                      </CardTitle>
                      {org.slug && (
                        <p className="text-xs text-white/50 font-mono">/{org.slug}</p>
                      )}
                    </div>
                    <Building2 className="h-5 w-5 text-white/40 shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Users className="h-4 w-4" />
                    <span>{org.memberCount} membre{org.memberCount !== 1 ? "s" : ""}</span>
                  </div>
                  {org.createdAt && (
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Créée le {new Date(org.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  )}
                  <div className="pt-2">
                    <span className="text-xs text-yellow-400 hover:text-yellow-300">
                      Voir les détails →
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


