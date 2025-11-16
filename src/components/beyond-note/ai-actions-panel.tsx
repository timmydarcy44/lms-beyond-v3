"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Languages, 
  FileCheck, 
  Volume2,
  Loader2,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";

interface AIActionsPanelProps {
  documentId: string | null;
  extractedText: string;
}

type AIAction = 
  | "revision-sheet"
  | "reformulate"
  | "translate"
  | "diagram"
  | "cleanup"
  | "audio";

interface AIActionConfig {
  id: AIAction;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const aiActions: AIActionConfig[] = [
  {
    id: "revision-sheet",
    label: "Créer une fiche de révision",
    description: "Génère une fiche de révision structurée à partir du document",
    icon: <FileText className="h-5 w-5" />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "reformulate",
    label: "Reformuler",
    description: "Reformule le texte pour améliorer la clarté",
    icon: <Sparkles className="h-5 w-5" />,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "translate",
    label: "Traduire",
    description: "Traduit le document dans une autre langue",
    icon: <Languages className="h-5 w-5" />,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "diagram",
    label: "Créer un schéma",
    description: "Génère un schéma visuel à partir du contenu",
    icon: <ImageIcon className="h-5 w-5" />,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "cleanup",
    label: "Remettre au propre",
    description: "Nettoie et structure le texte",
    icon: <FileCheck className="h-5 w-5" />,
    color: "from-indigo-500 to-blue-500",
  },
  {
    id: "audio",
    label: "Transformer en audio",
    description: "Convertit le texte en fichier audio",
    icon: <Volume2 className="h-5 w-5" />,
    color: "from-rose-500 to-pink-500",
  },
];

export function AIActionsPanel({ documentId, extractedText }: AIActionsPanelProps) {
  const [loadingAction, setLoadingAction] = useState<AIAction | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<AIAction | null>(null);

  const handleAIAction = async (action: AIAction) => {
    if (!documentId || !extractedText) {
      toast.error("Aucun document disponible");
      return;
    }

    setLoadingAction(action);
    setResult(null);
    setCurrentAction(action);

    try {
      const response = await fetch("/api/beyond-note/ai-action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          action,
          text: extractedText,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors du traitement");
      }

      const data = await response.json();
      setResult(data.result);
      toast.success("Traitement terminé avec succès !");
    } catch (error) {
      toast.error("Erreur lors du traitement IA");
      console.error(error);
      setResult(null);
      setCurrentAction(null);
    } finally {
      setLoadingAction(null);
    }
  };

  const currentActionConfig = currentAction ? aiActions.find(a => a.id === currentAction) : null;

  return (
    <div className="space-y-6">
      {/* Actions IA */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
            Transformations disponibles
          </CardTitle>
          <CardDescription style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
            Transformez votre document avec l'intelligence artificielle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {aiActions.map((action) => (
              <Button
                key={action.id}
                onClick={() => handleAIAction(action.id)}
                disabled={loadingAction !== null}
                variant={currentAction === action.id ? "default" : "outline"}
                className={`h-auto p-4 flex flex-col items-start gap-2 transition-all ${
                  currentAction === action.id 
                    ? `bg-gradient-to-br ${action.color} text-white` 
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 w-full">
                  {loadingAction === action.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <div className={currentAction === action.id ? "text-white" : ""}>
                      {action.icon}
                    </div>
                  )}
                  <span className={`font-semibold text-left flex-1 ${currentAction === action.id ? "text-white" : ""}`} style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                    {action.label}
                  </span>
                </div>
                <p className={`text-xs text-left ${currentAction === action.id ? "text-white/80" : "text-gray-500"}`} style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  {action.description}
                </p>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Résultat */}
      {result && currentActionConfig && (
        <Card className="border-2 border-violet-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${currentActionConfig.color}`}>
                {currentActionConfig.icon}
              </div>
              <div>
                <CardTitle style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  {currentActionConfig.label}
                </CardTitle>
                <CardDescription style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  Résultat de la transformation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-6 max-h-[600px] overflow-y-auto">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
                  {result}
                </pre>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(result);
                  toast.success("Résultat copié dans le presse-papiers");
                }}
              >
                Copier
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const blob = new Blob([result], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${currentActionConfig.label.toLowerCase().replace(/\s+/g, '-')}.txt`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Télécharger
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

