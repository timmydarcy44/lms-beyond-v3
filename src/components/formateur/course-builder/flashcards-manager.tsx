"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Flashcard = {
  id: string;
  front: string;
  back: string;
  course_id?: string | null;
  chapter_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

type FlashcardsManagerProps = {
  courseId?: string;
  chapterId?: string;
};

export function FlashcardsManager({ courseId, chapterId }: FlashcardsManagerProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadFlashcards();
    }
  }, [courseId, chapterId]);

  const loadFlashcards = async () => {
    if (!courseId) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (courseId) params.append("courseId", courseId);
      // Note: chapterId peut être un ID local (nanoid) du builder, pas un UUID de la DB
      // On ne l'utilise que si c'est un UUID valide (format UUID)
      // Sinon, on récupère toutes les flashcards du cours
      if (chapterId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chapterId)) {
        params.append("chapterId", chapterId);
      }

      const response = await fetch(`/api/flashcards?${params.toString()}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setFlashcards(data.flashcards || []);
    } catch (error) {
      console.error("Error loading flashcards:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors du chargement";
      toast.error("Erreur lors du chargement des flashcards", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!courseId) {
      toast.error("Le cours doit être sauvegardé avant de créer des flashcards");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          chapterId: chapterId || null,
          front: "Question",
          back: "Réponse",
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          try {
            errorData = JSON.parse(text);
          } catch {
            errorData = { error: text || `Erreur HTTP ${response.status}: ${response.statusText}` };
          }
        } catch {
          errorData = { error: `Erreur HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || errorData.details || "Erreur lors de la création");
      }

      const data = await response.json();
      
      if (!data || !data.flashcard) {
        console.error("[flashcards] Réponse invalide de l'API:", data);
        throw new Error("La flashcard n'a pas été créée correctement. Réponse invalide de l'API.");
      }
      
      // Ajouter la flashcard créée à la liste immédiatement
      setFlashcards((prev) => [...prev, data.flashcard]);
      
      // Mettre en mode édition immédiatement
      setEditingId(data.flashcard.id);
      setEditFront(data.flashcard.front || "Question");
      setEditBack(data.flashcard.back || "Réponse");
      
      // Recharger les flashcards depuis la base de données en arrière-plan pour s'assurer qu'elles sont à jour
      loadFlashcards().catch((error) => {
        console.error("[flashcards] Erreur lors du rechargement:", error);
      });
      
      toast.success("Flashcard créée");
    } catch (error) {
      console.error("Error creating flashcard:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la création";
      toast.error("Erreur lors de la création", {
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (flashcard: Flashcard) => {
    setEditingId(flashcard.id);
    setEditFront(flashcard.front);
    setEditBack(flashcard.back);
  };

  const handleSave = async (id: string) => {
    if (!editFront.trim() || !editBack.trim()) {
      toast.error("La question et la réponse sont requises");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/flashcards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          front: editFront.trim(),
          back: editBack.trim(),
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la sauvegarde");

      const data = await response.json();
      setFlashcards((prev) => prev.map((f) => (f.id === id ? data.flashcard : f)));
      setEditingId(null);
      toast.success("Flashcard sauvegardée");
    } catch (error) {
      console.error("Error saving flashcard:", error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette flashcard ?")) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/flashcards?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");

      setFlashcards((prev) => prev.filter((f) => f.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
      toast.success("Flashcard supprimée");
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditFront("");
    setEditBack("");
  };

  if (!courseId) {
    return (
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Flashcards</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center text-sm text-white/60">
          <p className="mb-2">Sauvegardez le cours pour gérer les flashcards</p>
          <p className="text-xs text-white/40">Les flashcards générées automatiquement seront sauvegardées une fois le cours enregistré.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Flashcards</CardTitle>
        <Button
          onClick={handleCreate}
          disabled={isSaving}
          className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="mr-2 h-3.5 w-3.5" />
          )}
          Ajouter
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
          </div>
        ) : flashcards.length === 0 ? (
          <div className="py-8 text-center text-sm text-white/60">
            Aucune flashcard. Cliquez sur "Ajouter" pour en créer une.
          </div>
        ) : (
          flashcards.map((flashcard) => (
            <div
              key={flashcard.id}
              className="rounded-2xl border border-white/10 bg-black/35 p-4"
            >
              {editingId === flashcard.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                      Question (Recto)
                    </label>
                    <Textarea
                      value={editFront}
                      onChange={(e) => setEditFront(e.target.value)}
                      className="min-h-[80px] border-white/15 bg-black/40 text-sm text-white"
                      placeholder="Question..."
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                      Réponse (Verso)
                    </label>
                    <Textarea
                      value={editBack}
                      onChange={(e) => setEditBack(e.target.value)}
                      className="min-h-[80px] border-white/15 bg-black/40 text-sm text-white"
                      placeholder="Réponse..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleSave(flashcard.id)}
                      disabled={isSaving}
                      className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      ) : (
                        <Save className="mr-1.5 h-3 w-3" />
                      )}
                      Enregistrer
                    </Button>
                    <Button
                      onClick={handleCancel}
                      disabled={isSaving}
                      variant="ghost"
                      className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 hover:bg-white/10 disabled:opacity-50"
                    >
                      <X className="mr-1.5 h-3 w-3" />
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                          Question
                        </span>
                        <p className="mt-1 text-sm text-white">{flashcard.front}</p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                          Réponse
                        </span>
                        <p className="mt-1 text-sm text-white/80">{flashcard.back}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleEdit(flashcard)}
                        variant="ghost"
                        size="sm"
                        className="rounded-full border border-white/20 px-2 py-1 text-white/70 hover:bg-white/10"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(flashcard.id)}
                        variant="ghost"
                        size="sm"
                        className="rounded-full border border-white/20 px-2 py-1 text-white/70 hover:bg-red-500/20 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

