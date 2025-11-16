"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileJson, FileText, Calendar, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Questionnaire = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  frequency: string;
  created_at: string;
  questions?: Array<{ id: string }>;
  responses_count?: number;
};

export function BeyondCareList() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState<"natural" | "soft" | null>(null);

  useEffect(() => {
    loadQuestionnaires();
  }, []);

  const loadQuestionnaires = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/mental-health/questionnaires");
      if (response.ok) {
        const data = await response.json();
        setQuestionnaires(data.questionnaires || []);
      }
    } catch (error) {
      console.error("[beyond-care-list] Error loading questionnaires:", error);
      toast.error("Erreur lors du chargement des questionnaires");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (questionnaireId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/mental-health/questionnaires/${questionnaireId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (response.ok) {
        setQuestionnaires((prev) =>
          prev.map((q) => (q.id === questionnaireId ? { ...q, is_active: !currentStatus } : q))
        );
        toast.success(`Questionnaire ${!currentStatus ? "activé" : "désactivé"}`);
      } else {
        toast.error("Erreur lors de la modification");
      }
    } catch (error) {
      console.error("[beyond-care-list] Error toggling active:", error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleSeedNatural = async () => {
    setSeeding("natural");
    try {
      const response = await fetch("/api/mental-health/questionnaires/seed/functionnement-naturel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Impossible de créer le questionnaire");
      }

      toast.success("Questionnaire installé", {
        description: "Fonctionnement naturel est maintenant disponible.",
      });
      await loadQuestionnaires();
    } catch (error: any) {
      console.error("[beyond-care-list] seed error", error);
      toast.error("Erreur", {
        description: error?.message || "Installation impossible.",
      });
    } finally {
      setSeeding(null);
    }
  };

  const handleSeedSoftSkills = async () => {
    setSeeding("soft");
    try {
      const response = await fetch("/api/mental-health/questionnaires/seed/soft-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Impossible de créer le questionnaire");
      }

      toast.success("Questionnaire installé", {
        description: "Soft Skills – Profil 360 est maintenant disponible.",
      });
      await loadQuestionnaires();
    } catch (error: any) {
      console.error("[beyond-care-list] seed soft skills error", error);
      toast.error("Erreur", {
        description: error?.message || "Installation impossible.",
      });
    } finally {
      setSeeding(null);
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
          <h1 className="text-2xl font-semibold text-gray-900">Beyond Care</h1>
          <p className="text-sm text-gray-600 mt-1">
            Importez vos questionnaires Beyond Care au format JSON
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleSeedNatural}
            disabled={seeding !== null}
          >
            <Sparkles className="h-4 w-4" />
            {seeding === "natural" ? "Installation..." : "Installer 'Fonctionnement naturel'"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleSeedSoftSkills}
            disabled={seeding !== null}
          >
            <Sparkles className="h-4 w-4" />
            {seeding === "soft" ? "Installation..." : "Installer 'Soft Skills – Profil 360'"}
          </Button>
          <Button asChild>
            <Link href="/super/premium/beyond-care/questionnaires/new">
              <FileJson className="h-4 w-4 mr-2" />
              Intégrer un questionnaire (JSON)
            </Link>
          </Button>
        </div>
      </div>

      {/* Liste des questionnaires */}
      {questionnaires.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun questionnaire importé
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Importez votre premier questionnaire en utilisant un fichier JSON conforme ou installez le modèle préconfiguré.
              </p>
              <Button asChild>
                <Link href="/super/premium/beyond-care/questionnaires/new">
                  <FileJson className="h-4 w-4 mr-2" />
                  Intégrer un questionnaire
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {questionnaires.map((questionnaire) => (
            <Card key={questionnaire.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{questionnaire.title}</CardTitle>
                    {questionnaire.description && (
                      <CardDescription className="mt-2">
                        {questionnaire.description}
                      </CardDescription>
                    )}
                  </div>
                  <div
                    className={`h-3 w-3 rounded-full flex-shrink-0 mt-1 ${
                      questionnaire.is_active ? "bg-green-500" : "bg-gray-300"
                    }`}
                    title={questionnaire.is_active ? "Actif" : "Inactif"}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {questionnaire.frequency === "weekly"
                        ? "Hebdomadaire"
                        : questionnaire.frequency === "biweekly"
                        ? "Bi-hebdomadaire"
                        : "Mensuel"}
                    </span>
                  </div>
                  {questionnaire.questions && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>
                        {Array.isArray(questionnaire.questions) 
                          ? questionnaire.questions.length 
                          : 0} question{Array.isArray(questionnaire.questions) && questionnaire.questions.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleActive(questionnaire.id, questionnaire.is_active)}
                  >
                    {questionnaire.is_active ? "Désactiver" : "Activer"}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/super/premium/beyond-care/questionnaires/${questionnaire.id}`}>
                      Voir
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/apprenant/questionnaires/${questionnaire.id}`}>
                      Prévisualiser
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

