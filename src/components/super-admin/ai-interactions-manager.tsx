"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, History, FileText, Sparkles, BookOpen, Zap, MessageSquare } from "lucide-react";
import { toast } from "sonner";

type AIFeature = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
  promptLocation: string;
  currentPrompt: string;
};

const AI_FEATURES: AIFeature[] = [
  {
    id: "generate-course-structure",
    name: "Génération de structure de cours",
    description: "Génère la structure complète d'une formation avec sections, chapitres et sous-chapitres",
    icon: <FileText className="h-5 w-5" />,
    endpoint: "/api/ai/generate-course-structure",
    promptLocation: "src/app/api/ai/generate-course-structure/route.ts",
    currentPrompt: `Génère la structure complète d'une formation avec sections, chapitres et sous-chapitres.

{context}

Instructions spécifiques : {userPrompt}

La structure doit être :
- Logique et progressive
- Complète avec sections, chapitres et sous-chapitres
- Adaptée au public cible
- Pédagogiquement cohérente
- Avec des durées estimées réalistes`,
  },
  {
    id: "create-chapter",
    name: "Création de chapitre",
    description: "Génère un chapitre complet avec contenu, résumé et sous-chapitres suggérés",
    icon: <BookOpen className="h-5 w-5" />,
    endpoint: "/api/ai/create-chapter",
    promptLocation: "src/lib/ai/prompts/chapter-generation.ts",
    currentPrompt: `Tu es un expert en pédagogie et en création de contenu de formation.

{contextSection}

L'utilisateur souhaite créer un chapitre avec le prompt suivant :
"{userPrompt}"

Génère un chapitre de formation complet et structuré au format JSON suivant :
{
  "title": "Titre du chapitre (accrocheur et clair)",
  "summary": "Résumé pédagogique en 2-3 phrases expliquant l'objectif et le livrable",
  "content": "Contenu détaillé du chapitre en markdown. Inclut des sections structurées, des points clés, des exemples concrets, et des call-to-action pédagogiques.",
  "duration": "Durée estimée (ex: '45 min', '1h30')",
  "type": "video" | "text" | "document",
  "suggestedSubchapters": [...]
}

Le contenu doit être :
- Pédagogique et actionnable
- Structuré avec des sections claires (utilise ## pour les titres de sections)
- Enrichi d'exemples concrets et de cas pratiques
- Adapté au contexte de la formation mentionné
- Rédigé en français

Réponds uniquement avec le JSON, sans texte additionnel.`,
  },
  {
    id: "generate-flashcards",
    name: "Génération de flashcards",
    description: "Génère des flashcards à partir du contenu d'un chapitre",
    icon: <Zap className="h-5 w-5" />,
    endpoint: "/api/ai/generate-flashcards",
    promptLocation: "src/lib/ai/prompts/chapter-generation.ts",
    currentPrompt: `Tu es un expert en pédagogie et en création de flashcards éducatives.

À partir du contenu suivant du chapitre "{chapterTitle}" :

{chapterContent}

Génère 5 à 8 flashcards au format JSON suivant :
{
  "flashcards": [
    {
      "question": "Question claire et précise",
      "answer": "Réponse détaillée et pédagogique",
      "tags": ["tag1", "tag2"],
      "difficulty": "facile" | "intermédiaire" | "expert"
    }
  ]
}

Les flashcards doivent :
- Couvrir les concepts clés du chapitre
- Être progressives (de facile à expert)
- Utiliser des questions ouvertes qui favorisent la réflexion
- Avoir des réponses complètes mais concises
- Être adaptées à la révision active

Réponds uniquement avec le JSON, sans texte additionnel.`,
  },
  {
    id: "transform-text-rephrase",
    name: "Transformation de texte - Reformuler",
    description: "Reformule le texte sélectionné (simplifier, enrichir, formaliser, etc.)",
    icon: <MessageSquare className="h-5 w-5" />,
    endpoint: "/api/ai/transform-text",
    promptLocation: "src/lib/ai/prompts/text-transformation.ts (buildRephrasePrompt)",
    currentPrompt: `{instruction}

Texte à transformer :
"{text}"

Réponds uniquement avec le texte reformulé, sans commentaire additionnel.`,
  },
  {
    id: "transform-text-mindmap",
    name: "Transformation de texte - Carte mentale",
    description: "Génère une carte mentale structurée à partir du texte",
    icon: <MessageSquare className="h-5 w-5" />,
    endpoint: "/api/ai/transform-text",
    promptLocation: "src/lib/ai/prompts/text-transformation.ts (buildMindMapPrompt)",
    currentPrompt: `À partir du texte suivant, génère une carte mentale structurée au format JSON :

"{text}"

Format JSON attendu :
{
  "centralTheme": "Thème central du texte",
  "mainBranches": [
    {
      "label": "Nom de la branche principale",
      "children": [
        {
          "label": "Sous-concept",
          "children": []
        }
      ]
    }
  ]
}

La carte mentale doit :
- Extraire les idées clés
- Organiser les concepts de manière hiérarchique
- Être claire et structurée
- Maximum 3-4 branches principales, 2-3 niveaux de profondeur

Réponds uniquement avec le JSON, sans texte additionnel.`,
  },
  {
    id: "transform-text-schema",
    name: "Transformation de texte - Schéma",
    description: "Génère un schéma visuel structuré à partir du texte",
    icon: <MessageSquare className="h-5 w-5" />,
    endpoint: "/api/ai/transform-text",
    promptLocation: "src/lib/ai/prompts/text-transformation.ts (buildSchemaPrompt)",
    currentPrompt: `À partir du texte suivant, génère un schéma visuel structuré au format JSON :

"{text}"

Format JSON attendu :
{
  "title": "Titre du schéma",
  "description": "Description du schéma en une phrase",
  "elements": [
    {
      "id": "element1",
      "label": "Label de l'élément",
      "type": "box" | "circle" | "arrow",
      "position": { "x": 100, "y": 100 },
      "connections": ["element2"]
    }
  ]
}

Le schéma doit :
- Visualiser les concepts et leurs relations
- Être adapté à une représentation graphique
- Utiliser des formes simples (box, circle)
- Inclure des flèches (arrow) pour les relations

Réponds uniquement avec le JSON, sans texte additionnel.`,
  },
  {
    id: "transform-text-translate",
    name: "Transformation de texte - Traduire",
    description: "Traduit le texte dans une langue cible",
    icon: <MessageSquare className="h-5 w-5" />,
    endpoint: "/api/ai/transform-text",
    promptLocation: "src/lib/ai/prompts/text-transformation.ts (buildTranslatePrompt)",
    currentPrompt: `Traduis le texte suivant en {targetLanguage} :

"{text}"

Instructions :
- Conserve le sens et le ton original
- Adapte le texte à la culture de la langue cible si nécessaire
- Utilise un vocabulaire adapté au contexte pédagogique

Réponds uniquement avec la traduction, sans commentaire additionnel.`,
  },
  {
    id: "transform-text-audio",
    name: "Transformation de texte - Audio",
    description: "Génère un script audio optimisé pour la narration",
    icon: <MessageSquare className="h-5 w-5" />,
    endpoint: "/api/ai/transform-text",
    promptLocation: "src/lib/ai/prompts/text-transformation.ts (buildAudioPrompt)",
    currentPrompt: `À partir du texte suivant, génère un script audio structuré et optimisé pour la narration :

"{text}"

Format JSON attendu :
{
  "script": "Script audio complet, optimisé pour la narration vocale avec pauses et intonations indiquées",
  "notes": "Notes pour le narrateur (ton, vitesse, pauses importantes)",
  "durationEstimate": "Durée estimée en minutes"
}

Le script doit :
- Être fluide à l'oral
- Inclure des pauses naturelles
- Utiliser un langage adapté à l'audio
- Être structuré par paragraphes courts

Réponds uniquement avec le JSON, sans texte additionnel.`,
  },
  {
    id: "transform-text-insights",
    name: "Transformation de texte - Insights",
    description: "Analyse le texte et extrait des insights pédagogiques",
    icon: <MessageSquare className="h-5 w-5" />,
    endpoint: "/api/ai/transform-text",
    promptLocation: "src/lib/ai/prompts/text-transformation.ts (buildInsightsPrompt)",
    currentPrompt: `Analyse le texte suivant et extrais des insights pédagogiques :

"{text}"

Format JSON attendu :
{
  "keyConcepts": ["concept1", "concept2"],
  "examples": ["exemple concret 1", "exemple concret 2"],
  "analogies": ["analogie pour faciliter la compréhension"],
  "reviewQuestions": [
    {
      "question": "Question de révision",
      "answer": "Réponse suggérée"
    }
  ],
  "connections": ["Lien avec d'autres concepts", "Application pratique"]
}

Les insights doivent être :
- Actionnables et concrets
- Adaptés à l'apprentissage
- Variés et complémentaires

Réponds uniquement avec le JSON, sans texte additionnel.`,
  },
];

export function AIInteractionsManager() {
  const [editingFeature, setEditingFeature] = useState<string | null>(null);
  const [editedPrompts, setEditedPrompts] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("prompts");
  const [promptsFromDB, setPromptsFromDB] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Charger les prompts depuis la base de données au montage
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const response = await fetch("/api/super-admin/ai/prompts");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.prompts) {
            const promptsMap: Record<string, string> = {};
            data.prompts.forEach((p: any) => {
              promptsMap[p.feature_id] = p.prompt_template;
            });
            setPromptsFromDB(promptsMap);
          }
        }
      } catch (error) {
        console.error("Error loading prompts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPrompts();
  }, []);

  const handleEdit = (featureId: string) => {
    const feature = AI_FEATURES.find((f) => f.id === featureId);
    if (feature) {
      // Utiliser le prompt de la DB s'il existe, sinon le prompt par défaut
      const promptToEdit = promptsFromDB[featureId] || feature.currentPrompt;
      setEditedPrompts((prev) => ({
        ...prev,
        [featureId]: promptToEdit,
      }));
      setEditingFeature(featureId);
    }
  };

  const getCurrentPrompt = (featureId: string): string => {
    // Priorité : prompt édité > prompt DB > prompt par défaut
    if (editedPrompts[featureId]) {
      return editedPrompts[featureId];
    }
    if (promptsFromDB[featureId]) {
      return promptsFromDB[featureId];
    }
    const feature = AI_FEATURES.find((f) => f.id === featureId);
    return feature?.currentPrompt || "";
  };

  const handleSave = async (featureId: string) => {
    const feature = AI_FEATURES.find((f) => f.id === featureId);
    if (!feature) return;

    try {
      const response = await fetch("/api/super-admin/ai/prompts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureId,
          prompt: editedPrompts[featureId],
          promptLocation: feature.promptLocation,
          featureName: feature.name,
          endpoint: feature.endpoint,
          description: feature.description,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      const result = await response.json();
      if (result.success) {
        // Mettre à jour le prompt dans l'état local
        setPromptsFromDB((prev) => ({
          ...prev,
          [featureId]: editedPrompts[featureId],
        }));
        toast.success("Prompt sauvegardé avec succès");
        setEditingFeature(null);
      } else {
        throw new Error(result.error || "Erreur lors de la sauvegarde");
      }
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde du prompt");
      console.error(error);
    }
  };

  const handleCancel = (featureId: string) => {
    setEditingFeature(null);
    setEditedPrompts((prev) => {
      const next = { ...prev };
      delete next[featureId];
      return next;
    });
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="prompts" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Prompts
        </TabsTrigger>
        <TabsTrigger value="history" className="flex items-center gap-2">
          <History className="h-4 w-4" />
          Historique
        </TabsTrigger>
      </TabsList>

      <TabsContent value="prompts" className="space-y-6 mt-6">
        <div className="grid gap-6">
          {AI_FEATURES.map((feature) => {
            const isEditing = editingFeature === feature.id;
            const currentPrompt = getCurrentPrompt(feature.id);
            const editedPrompt = editedPrompts[feature.id] || currentPrompt;

            return (
              <Card key={feature.id} className="border-white/10 bg-white/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20">
                        {feature.icon}
                      </div>
                      <div>
                        <CardTitle className="text-white">{feature.name}</CardTitle>
                        <CardDescription className="text-white/60 mt-1">
                          {feature.description}
                        </CardDescription>
                      </div>
                    </div>
                    {!isEditing && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(feature.id)}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Modifier
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Badge variant="outline" className="border-white/20 text-white/70">
                      {feature.endpoint}
                    </Badge>
                    <Badge variant="outline" className="border-white/20 text-white/70 text-xs">
                      {feature.promptLocation}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editedPrompt}
                        onChange={(e) =>
                          setEditedPrompts((prev) => ({
                            ...prev,
                            [feature.id]: e.target.value,
                          }))
                        }
                        className="min-h-[300px] bg-black/30 border-white/20 text-white font-mono text-sm"
                        placeholder="Entrez le prompt..."
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleSave(feature.id)}
                          className="bg-yellow-400 hover:bg-yellow-500 text-black"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Sauvegarder
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleCancel(feature.id)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-black/30 border border-white/10 p-4">
                      <pre className="text-sm text-white/80 font-mono whitespace-pre-wrap overflow-x-auto">
                        {currentPrompt}
                      </pre>
                      {promptsFromDB[feature.id] && (
                        <Badge variant="outline" className="mt-2 border-green-400/30 text-green-400">
                          Personnalisé
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="history" className="space-y-6 mt-6">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des interactions IA
            </CardTitle>
            <CardDescription className="text-white/60">
              Consultez toutes les interactions avec l'IA effectuées sur la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AIInteractionsHistory />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function AIInteractionsHistory() {
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  useEffect(() => {
    const loadInteractions = async () => {
      try {
        const url = selectedFeature
          ? `/api/super-admin/ai/interactions?featureId=${selectedFeature}`
          : "/api/super-admin/ai/interactions";
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setInteractions(data.interactions || []);
          }
        }
      } catch (error) {
        console.error("Error loading interactions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInteractions();
  }, [selectedFeature]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 text-sm">Chargement de l'historique...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm text-white/70">Filtrer par fonctionnalité :</label>
        <select
          value={selectedFeature || ""}
          onChange={(e) => setSelectedFeature(e.target.value || null)}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white"
        >
          <option value="">Toutes</option>
          {AI_FEATURES.map((feature) => (
            <option key={feature.id} value={feature.id}>
              {feature.name}
            </option>
          ))}
        </select>
      </div>

      {interactions.length === 0 ? (
        <div className="text-center py-12">
          <History className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 text-sm">
            Aucune interaction IA enregistrée pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {interactions.map((interaction) => (
            <Card key={interaction.id} className="border-white/10 bg-white/5">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-white font-medium">{interaction.feature_name}</h4>
                    <p className="text-xs text-white/50 mt-1">
                      {new Date(interaction.created_at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <Badge
                    variant={interaction.success ? "default" : "destructive"}
                    className={interaction.success ? "bg-green-500/20 text-green-300" : ""}
                  >
                    {interaction.success ? "Succès" : "Erreur"}
                  </Badge>
                </div>
                {interaction.error_message && (
                  <p className="text-sm text-red-400 mt-2">{interaction.error_message}</p>
                )}
                {interaction.tokens_used && (
                  <p className="text-xs text-white/50 mt-2">
                    Tokens utilisés : {interaction.tokens_used} | Durée : {interaction.duration_ms}ms
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

