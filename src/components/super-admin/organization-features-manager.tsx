"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Gamepad2, Sparkles, BarChart3, Brain, Loader2, Heart } from "lucide-react";

type Feature = {
  key: string;
  name: string;
  description: string;
  icon: typeof Gamepad2;
  enabled: boolean;
  expiresAt?: string | null;
};

type OrganizationFeaturesManagerProps = {
  orgId: string;
  organizationName: string;
};

export function OrganizationFeaturesManager({
  orgId,
  organizationName,
}: OrganizationFeaturesManagerProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[OrganizationFeaturesManager] Component mounted, orgId:", orgId);
    loadFeatures();
  }, [orgId]);

  const loadFeatures = async () => {
    setError(null);
    setLoading(true);
    console.log("[OrganizationFeaturesManager] Loading features for orgId:", orgId);
    try {
      const response = await fetch(`/api/super-admin/organizations/${orgId}/features`);
      console.log("[OrganizationFeaturesManager] API response status:", response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[OrganizationFeaturesManager] API error:", errorData);
        throw new Error(errorData.error || "Erreur lors du chargement des fonctionnalités");
      }
      const data = await response.json();
      console.log("[OrganizationFeaturesManager] Features loaded:", data);
      setFeatures(data || []);
    } catch (error: any) {
      console.error("[OrganizationFeaturesManager] Error loading features:", error);
      setError(error.message || "Erreur lors du chargement des fonctionnalités");
      // Ne pas afficher de toast si c'est juste que la table n'existe pas encore
      if (!error.message?.includes("42P01")) {
        toast.error(error.message || "Erreur lors du chargement des fonctionnalités");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureKey: string, enabled: boolean) => {
    setUpdating(featureKey);
    try {
      const response = await fetch(
        `/api/super-admin/organizations/${orgId}/features/${featureKey}`,
        {
          method: enabled ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      await loadFeatures();
      toast.success(
        enabled
          ? "Fonctionnalité activée avec succès"
          : "Fonctionnalité désactivée avec succès"
      );
    } catch (error) {
      console.error("Error toggling feature:", error);
      toast.error("Erreur lors de la mise à jour de la fonctionnalité");
    } finally {
      setUpdating(null);
    }
  };

  const availableFeatures: Omit<Feature, "enabled" | "expiresAt">[] = [
    {
      key: "beyond_care",
      name: "Beyond Care",
      description: "Suivi de la santé mentale avec questionnaires intelligents et dashboards de suivi",
      icon: Heart,
    },
    {
      key: "gamification",
      name: "Gamification",
      description: "Accès aux simulations immersives et aux fonctionnalités de gamification",
      icon: Gamepad2,
    },
    {
      key: "ai_advanced",
      name: "IA Avancée",
      description: "Accès aux fonctionnalités d'IA avancées pour la création de contenu",
      icon: Brain,
    },
    {
      key: "analytics_pro",
      name: "Analytics Pro",
      description: "Statistiques détaillées et rapports avancés",
      icon: BarChart3,
    },
    {
      key: "mental_health_tracking",
      name: "Suivi de santé mentale",
      description: "Outils de suivi et d'analyse du bien-être et de la santé mentale des apprenants",
      icon: Heart,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 shadow-sm">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-600 font-medium mb-2">Erreur de chargement</p>
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <p className="text-xs text-gray-600 mb-4">
              Assurez-vous d'avoir exécuté le script SQL : <code className="bg-gray-100 px-2 py-1 rounded">CREATE_ORGANIZATION_FEATURES_TABLE.sql</code>
            </p>
            <Button onClick={loadFeatures} variant="outline" size="sm">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">Fonctionnalités Premium</CardTitle>
          <CardDescription className="text-gray-600">
            Gérez les fonctionnalités activées pour {organizationName}. Cochez une fonctionnalité pour l'activer dans l'interface de l'admin de l'organisation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableFeatures.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Aucune fonctionnalité disponible pour le moment.
            </p>
          ) : (
            availableFeatures.map((feature) => {
              const currentFeature = features.find((f) => f.key === feature.key);
              const enabled = currentFeature?.enabled || false;
              const Icon = feature.icon;

              return (
                <div
                  key={feature.key}
                  className={`flex items-start justify-between rounded-lg border p-4 transition-all ${
                    enabled
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-gray-200 bg-gray-50/50 hover:bg-gray-100/50"
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`rounded-lg p-3 ${
                      enabled ? "bg-emerald-100" : "bg-gray-100"
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        enabled ? "text-emerald-600" : "text-gray-600"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                        {enabled && (
                          <Badge className="bg-emerald-500 text-white border-emerald-600">
                            Activé
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                      {enabled && currentFeature?.expiresAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Expire le {new Date(currentFeature.expiresAt).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) => toggleFeature(feature.key, checked)}
                      disabled={updating === feature.key}
                    />
                    <Label className="sr-only">
                      {enabled ? "Désactiver" : "Activer"} {feature.name}
                    </Label>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

