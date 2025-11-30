"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Briefcase, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Organization = {
  id: string;
  name: string;
  has_beyond_connect: boolean;
  members_count?: number;
  job_offers_count?: number;
};

export function BeyondConnectList() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/super-admin/organizations-with-beyond-connect");
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      } else {
        toast.error("Erreur lors du chargement des organisations");
      }
    } catch (error) {
      console.error("[beyond-connect-list] Error loading organizations:", error);
      toast.error("Erreur lors du chargement des organisations");
    } finally {
      setLoading(false);
    }
  };

  const toggleBeyondConnect = async (orgId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/super-admin/toggle-beyond-connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          enable: !currentStatus,
        }),
      });

      if (response.ok) {
        toast.success(
          currentStatus
            ? "Beyond Connect désactivé pour cette organisation"
            : "Beyond Connect activé pour cette organisation"
        );
        loadOrganizations();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de la modification");
      }
    } catch (error) {
      console.error("[beyond-connect-list] Error toggling Beyond Connect:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Organisations avec Beyond Connect</h2>
          <p className="text-muted-foreground mt-1">
            Gérez l'accès à Beyond Connect pour les organisations
          </p>
        </div>
        <Link href="/super/premium/beyond-connect/candidates">
          <Button className="bg-[#003087] hover:bg-[#002a6b] text-white">
            <Users className="mr-2 h-4 w-4" />
            Gérer les candidats
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-[#003087]/10 p-2">
                    <Building2 className="h-5 w-5 text-[#003087]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <CardDescription>ID: {org.id.slice(0, 8)}...</CardDescription>
                  </div>
                </div>
                <Badge variant={org.has_beyond_connect ? "default" : "secondary"}>
                  {org.has_beyond_connect ? (
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                  ) : (
                    <XCircle className="mr-1 h-3 w-3" />
                  )}
                  {org.has_beyond_connect ? "Actif" : "Inactif"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Membres
                  </span>
                  <span className="font-medium">{org.members_count || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Offres d'emploi
                  </span>
                  <span className="font-medium">{org.job_offers_count || 0}</span>
                </div>
                <div className="pt-2 border-t">
                  <Button
                    variant={org.has_beyond_connect ? "destructive" : "default"}
                    size="sm"
                    className="w-full"
                    onClick={() => toggleBeyondConnect(org.id, org.has_beyond_connect)}
                  >
                    {org.has_beyond_connect ? "Désactiver" : "Activer"} Beyond Connect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {organizations.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Aucune organisation trouvée
          </CardContent>
        </Card>
      )}
    </div>
  );
}

