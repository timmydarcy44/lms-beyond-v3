"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Calendar, Users, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Organization = {
  id: string;
  name: string;
  slug: string | null;
  created_at: string;
  hasBeyondNote: boolean;
  membersCount?: number;
};

export function BeyondNoteList() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/super-admin/organizations");
      if (response.ok) {
        const data = await response.json();
        
        // Charger les fonctionnalités pour chaque organisation
        const orgsWithFeatures = await Promise.all(
          (data.organizations || []).map(async (org: any) => {
            const featuresResponse = await fetch(
              `/api/super-admin/organizations/${org.id}/features`
            );
            let hasBeyondNote = false;
            if (featuresResponse.ok) {
              const featuresData = await featuresResponse.json();
              // L'API retourne un tableau de features avec { key, enabled, expiresAt }
              hasBeyondNote = Array.isArray(featuresData) && featuresData.some(
                (f: any) => f.key === "beyond_note" && f.enabled === true
              );
            }

            // Pour l'instant, on ne compte pas les membres (peut être ajouté plus tard)
            const membersCount = 0;

            return {
              ...org,
              hasBeyondNote,
              membersCount,
            };
          })
        );

        setOrganizations(orgsWithFeatures);
      }
    } catch (error) {
      console.error("[beyond-note-list] Error loading organizations:", error);
      toast.error("Erreur lors du chargement des organisations");
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (orgId: string, enable: boolean) => {
    try {
      const url = `/api/super-admin/organizations/${orgId}/features/beyond_note`;
      const method = enable ? "POST" : "DELETE";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success(
          enable
            ? "Beyond Note activé pour cette organisation"
            : "Beyond Note désactivé pour cette organisation"
        );
        loadOrganizations();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("[beyond-note-list] Error toggling feature:", error);
      toast.error("Erreur lors de la mise à jour de la fonctionnalité");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-600">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Beyond Note</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gérez l'accès à Beyond Note pour les organisations
          </p>
        </div>
        <Button asChild>
          <Link href="/beyond-note-app">
            <FileText className="h-4 w-4 mr-2" />
            Voir l'application
          </Link>
        </Button>
      </div>

      {/* Liste des organisations */}
      {organizations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune organisation
              </h3>
              <p className="text-sm text-gray-600">
                Créez une organisation pour commencer.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-violet-500" />
                      {org.name}
                    </CardTitle>
                    {org.slug && (
                      <CardDescription className="mt-1">
                        {org.slug}
                      </CardDescription>
                    )}
                  </div>
                  {org.hasBeyondNote ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{org.membersCount || 0} membre(s)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(org.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant={org.hasBeyondNote ? "destructive" : "default"}
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleFeature(org.id, !org.hasBeyondNote)}
                  >
                    {org.hasBeyondNote ? "Désactiver" : "Activer"}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/super/organisations/${org.id}`}>
                      Voir
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

