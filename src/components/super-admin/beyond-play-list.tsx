"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Video, Gamepad2, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type GamificationScenario = {
  id: string;
  title: string;
  description: string | null;
  scenario_type: string;
  created_at: string;
  videos_count?: number;
};

export function BeyondPlayList() {
  const [scenarios, setScenarios] = useState<GamificationScenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setLoading(true);
    try {
      // Pour l'instant, on simule avec les vidéos de gamification
      // Plus tard, on pourra créer une table dédiée aux scénarios
      const response = await fetch("/api/gamification/videos");
      if (response.ok) {
        const data = await response.json();
        // Grouper les vidéos par scénario (basé sur scenario_context)
        const scenariosMap = new Map<string, GamificationScenario>();
        
        (data.videos || []).forEach((video: any) => {
          const scenarioContext = video.scenario_context || "default";
          if (!scenariosMap.has(scenarioContext)) {
            scenariosMap.set(scenarioContext, {
              id: scenarioContext,
              title: video.scenario_context || "Scénario par défaut",
              description: `Scénario de ${video.scenario_context || "gamification"}`,
              scenario_type: "media_training",
              created_at: video.created_at || new Date().toISOString(),
              videos_count: 0,
            });
          }
          const scenario = scenariosMap.get(scenarioContext)!;
          scenario.videos_count = (scenario.videos_count || 0) + 1;
        });

        setScenarios(Array.from(scenariosMap.values()));
      }
    } catch (error) {
      console.error("[beyond-play-list] Error loading scenarios:", error);
      toast.error("Erreur lors du chargement des scénarios");
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-semibold text-gray-900">Beyond Play</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gérez vos scénarios de gamification et simulations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/super/gamification/videos">
              <Video className="h-4 w-4 mr-2" />
              Gérer les vidéos
            </Link>
          </Button>
          <Button asChild>
            <Link href="/super/gamification">
              <Plus className="h-4 w-4 mr-2" />
              Créer un scénario
            </Link>
          </Button>
        </div>
      </div>

      {/* Liste des scénarios */}
      {scenarios.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun scénario créé
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Créez votre premier scénario de gamification pour commencer.
              </p>
              <Button asChild>
                <Link href="/super/gamification">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer un scénario
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1 flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5 text-blue-500" />
                      {scenario.title}
                    </CardTitle>
                    {scenario.description && (
                      <CardDescription className="mt-2">
                        {scenario.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    <span>{scenario.videos_count || 0} vidéo(s)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(scenario.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href="/super/gamification">
                      Jouer
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/super/gamification/videos">
                      Gérer
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







