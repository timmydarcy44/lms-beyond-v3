"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useCourseBuilder } from "@/hooks/use-course-builder";

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
  const [localFlashcards, setLocalFlashcards] = useState<Flashcard[]>([]); // Flashcards créées localement (pas encore en DB avec chapter_id)
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Utiliser le snapshot du store pour trouver l'UUID du chapitre
  const snapshot = useCourseBuilder((state) => state.snapshot);

  // Clé pour le localStorage
  const localStorageKey = courseId && chapterId ? `flashcards-${courseId}-${chapterId}` : null;

  // Charger les flashcards locales depuis le localStorage au montage
  // IMPORTANT: Recharger à chaque changement de chapitre pour avoir les bonnes flashcards
  useEffect(() => {
    if (localStorageKey && chapterId) {
      try {
        const stored = localStorage.getItem(localStorageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Filtrer pour ne garder que celles du chapitre actuel (sécurité supplémentaire)
            const filtered = parsed.filter((f: any) => (f.chapter_id as any) === chapterId);
            console.log("[FlashcardsManager] Loading local flashcards from localStorage for chapter:", chapterId, "count:", filtered.length);
            setLocalFlashcards(filtered);
          } else {
            setLocalFlashcards([]);
          }
        } else {
          setLocalFlashcards([]);
        }
      } catch (error) {
        console.warn("[FlashcardsManager] Error loading from localStorage:", error);
        setLocalFlashcards([]);
      }
    } else {
      setLocalFlashcards([]);
    }
  }, [localStorageKey, chapterId]);

  // Sauvegarder les flashcards locales dans le localStorage
  useEffect(() => {
    if (localStorageKey && localFlashcards.length > 0) {
      try {
        localStorage.setItem(localStorageKey, JSON.stringify(localFlashcards));
        console.log("[FlashcardsManager] Saved local flashcards to localStorage:", localFlashcards.length);
      } catch (error) {
        console.warn("[FlashcardsManager] Error saving to localStorage:", error);
      }
    } else if (localStorageKey && localFlashcards.length === 0) {
      // Nettoyer le localStorage si plus de flashcards locales
      localStorage.removeItem(localStorageKey);
    }
  }, [localStorageKey, localFlashcards]);

  useEffect(() => {
    if (courseId) {
      // Réinitialiser les flashcards de la DB quand on change de chapitre
      setFlashcards([]);
      loadFlashcards();
      // Les flashcards locales sont chargées depuis le localStorage dans un autre useEffect
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, chapterId, snapshot]);

  // Écouter les événements de création de flashcards pour les afficher immédiatement
  useEffect(() => {
    if (!courseId || !chapterId) return;
    
    const handleFlashcardsCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("[FlashcardsManager] Event received: flashcards created", customEvent.detail);
      const eventDetail = customEvent.detail || {};
      const savedFlashcards = eventDetail.savedFlashcards || [];
      const createdFlashcards = eventDetail.flashcards || [];
      
      // Si les flashcards ont été sauvegardées en DB, les utiliser directement
      if (savedFlashcards.length > 0) {
        console.log("[FlashcardsManager] Flashcards were saved to DB, using saved flashcards:", savedFlashcards.length);
        // Ajouter les flashcards sauvegardées à la liste immédiatement
        setFlashcards((prev) => {
          const existingIds = new Set(prev.map((f: any) => f.id));
          const newFlashcards = savedFlashcards.filter((f: any) => !existingIds.has(f.id));
          return [...prev, ...newFlashcards];
        });
        // Recharger depuis la DB pour s'assurer qu'elles sont à jour
        setTimeout(() => {
          loadFlashcards();
        }, 500);
      } else if (createdFlashcards.length > 0) {
        // Si les flashcards n'ont pas été sauvegardées (pas d'UUID de chapitre), les stocker localement
        const flashcardsWithChapter = createdFlashcards.map((f: any, index: number) => ({
          id: f.id || `temp-${Date.now()}-${index}`,
          front: f.question || f.front || "",
          back: f.answer || f.back || "",
          course_id: courseId,
          chapter_id: chapterId, // Stocker le chapterId local pour référence
          created_at: new Date().toISOString(),
        }));
        
        console.log("[FlashcardsManager] Storing local flashcards for chapter:", chapterId, "count:", flashcardsWithChapter.length);
        setLocalFlashcards((prev) => {
          // IMPORTANT: Ne garder QUE les flashcards du chapitre actuel
          // Réinitialiser complètement si on change de chapitre
          const existing = prev.filter((f: any) => (f.chapter_id as any) === chapterId);
          // Éviter les doublons en vérifiant les IDs
          const existingIds = new Set(existing.map((f: any) => f.id));
          const newFlashcards = flashcardsWithChapter.filter((f: any) => !existingIds.has(f.id));
          const result = [...existing, ...newFlashcards];
          console.log("[FlashcardsManager] Adding new local flashcards:", newFlashcards.length, "existing:", existing.length, "total:", result.length);
          return result;
        });
      }
      
      // Recharger aussi depuis la DB après un délai
      setTimeout(() => {
        console.log("[FlashcardsManager] Reloading flashcards from DB after creation...");
        loadFlashcards();
      }, 1500);
    };

    window.addEventListener('flashcards-created', handleFlashcardsCreated);
    return () => {
      window.removeEventListener('flashcards-created', handleFlashcardsCreated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, chapterId]);

  // Log pour déboguer
  useEffect(() => {
    console.log("[FlashcardsManager] Rendered with:", JSON.stringify({ 
      courseId, 
      chapterId, 
      flashcardsCount: flashcards.length,
      localFlashcardsCount: localFlashcards.length,
      totalFlashcards: flashcards.length + localFlashcards.length,
      isLoading,
      hasFlashcards: flashcards.length > 0 || localFlashcards.length > 0
    }, null, 2));
    if (flashcards.length > 0 || localFlashcards.length > 0) {
      console.log("[FlashcardsManager] Flashcards from DB:", flashcards.map((f: any) => ({ id: f.id, front: f.front.substring(0, 50), chapter_id: f.chapter_id })));
      console.log("[FlashcardsManager] Local flashcards:", localFlashcards.map((f: any) => ({ id: f.id, front: f.front.substring(0, 50), chapter_id: f.chapter_id })));
    }
  }, [courseId, chapterId, flashcards.length, localFlashcards.length, isLoading, flashcards, localFlashcards]);

  const loadFlashcards = async () => {
    if (!courseId) {
      console.log("[FlashcardsManager] No courseId, skipping load");
      return;
    }
    
    console.log("[FlashcardsManager] Loading flashcards...", JSON.stringify({ courseId, chapterId }));
    setIsLoading(true);
    try {
      let actualChapterId: string | null = null;

      // Si chapterId est fourni, vérifier si c'est un UUID ou un ID local
      if (chapterId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(chapterId)) {
          // C'est déjà un UUID de la DB
          actualChapterId = chapterId;
          console.log("[FlashcardsManager] chapterId is already a UUID:", actualChapterId);
        } else {
          // C'est un ID local (nanoid), essayer de trouver l'UUID correspondant
          console.log("[FlashcardsManager] chapterId is local ID, trying to find UUID...", chapterId);
          try {
            // Méthode 1: Utiliser l'API find-by-local-id
            const findResponse = await fetch("/api/chapters/find-by-local-id", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ courseId, localChapterId: chapterId }),
            });
            
            if (findResponse.ok) {
              const findData = await findResponse.json();
              if (findData.chapterId) {
                actualChapterId = findData.chapterId;
                console.log("[FlashcardsManager] Found UUID via API:", actualChapterId);
              }
            }
            
            // Si l'API n'a pas trouvé, essayer de chercher dans le snapshot du store Zustand
            if (!actualChapterId && snapshot) {
              try {
                for (const section of snapshot.sections || []) {
                  for (const chapter of section.chapters || []) {
                    if (chapter.id === chapterId) {
                      // Si le chapitre a un dbId, l'utiliser
                      if ((chapter as any).dbId) {
                        actualChapterId = (chapter as any).dbId;
                        console.log("[FlashcardsManager] Found UUID via Zustand snapshot (dbId):", actualChapterId);
                      } else if (uuidRegex.test(chapter.id)) {
                        actualChapterId = chapter.id;
                        console.log("[FlashcardsManager] Found UUID via Zustand snapshot (id):", actualChapterId);
                      }
                      break;
                    }
                  }
                  if (actualChapterId) break;
                }
              } catch (snapshotError) {
                console.warn("[FlashcardsManager] Error checking Zustand snapshot:", snapshotError);
              }
            }
            
            if (!actualChapterId) {
              console.log("[FlashcardsManager] No UUID found for local ID, chapter may not be saved yet");
            }
          } catch (findError) {
            console.warn("[FlashcardsManager] Error finding chapter UUID:", findError);
          }
        }
      }

      const params = new URLSearchParams();
      params.append("courseId", courseId);
      // Ne charger que les flashcards du chapitre spécifique si on a un UUID
      if (actualChapterId) {
        params.append("chapterId", actualChapterId);
        console.log("[FlashcardsManager] Loading flashcards for chapter:", actualChapterId);
      } else {
        console.log("[FlashcardsManager] Loading all flashcards for course (no chapter UUID)");
      }

      const response = await fetch(`/api/flashcards?${params.toString()}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("[FlashcardsManager] API response:", { 
        totalFlashcards: data.flashcards?.length || 0,
        flashcards: data.flashcards?.map((f: any) => ({ id: f.id, chapter_id: f.chapter_id }))
      });
      
      // IMPORTANT: Filtrer les flashcards pour ne garder QUE celles du chapitre actuel
      // Mais aussi inclure celles avec chapter_id: null (pour tout le cours)
      let filteredFlashcards = data.flashcards || [];
      if (actualChapterId) {
        // Si on a un UUID, filtrer par chapter_id OU null (pour tout le cours)
        filteredFlashcards = filteredFlashcards.filter((f: any) => 
          f.chapter_id === actualChapterId || f.chapter_id === null
        );
        console.log("[FlashcardsManager] Filtered flashcards for chapter UUID:", actualChapterId, "->", filteredFlashcards.length, "flashcards");
      } else {
        // Si on n'a pas d'UUID, charger TOUTES les flashcards du cours (y compris celles avec chapter_id: null)
        // Elles seront mappées à toutes les leçons côté client
        console.log("[FlashcardsManager] No UUID found, loading all flashcards for course (including chapter_id: null):", filteredFlashcards.length);
        // Ne pas filtrer, garder toutes les flashcards du cours
      }
      
      console.log("[FlashcardsManager] Setting flashcards from DB:", filteredFlashcards.length);
      setFlashcards(filteredFlashcards);
      
      // Nettoyer les flashcards locales qui sont maintenant en DB
      if (filteredFlashcards.length > 0 && localFlashcards.length > 0) {
        const dbFlashcardIds = new Set(filteredFlashcards.map((f: any) => f.id));
        setLocalFlashcards((prev) => {        
          // Filtrer pour ne garder que celles du chapitre actuel ET qui ne sont pas en DB
          const filtered = prev.filter((f: any) =>
            chapterId && 
            (f.chapter_id as any) === chapterId && 
            !dbFlashcardIds.has(f.id)
          );
          // Sauvegarder dans localStorage
          if (localStorageKey) {
            try {
              if (filtered.length > 0) {
                localStorage.setItem(localStorageKey, JSON.stringify(filtered));
              } else {
                localStorage.removeItem(localStorageKey);
              }
            } catch (error) {
              console.warn("[FlashcardsManager] Error updating localStorage:", error);
            }
          }
          return filtered;
        });
      }
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

    console.log("[FlashcardsManager] Creating flashcard with:", JSON.stringify({
      courseId,
      chapterId,
      courseIdType: typeof courseId
    }));

    setIsSaving(true);
    try {
      // Trouver l'UUID du chapitre si chapterId est un ID local
      let actualChapterId: string | null = null;
      if (chapterId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(chapterId)) {
          actualChapterId = chapterId;
        } else {
          // C'est un ID local, essayer de trouver l'UUID correspondant
          try {
            const findResponse = await fetch("/api/chapters/find-by-local-id", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ courseId, localChapterId: chapterId }),
            });
            
            if (findResponse.ok) {
              const findData = await findResponse.json();
              if (findData.chapterId) {
                actualChapterId = findData.chapterId;
              }
            }
          } catch (findError) {
            console.warn("[flashcards] Could not find chapter UUID for local ID:", chapterId);
          }
        }
      }

      console.log("[FlashcardsManager] Sending flashcard creation request:", JSON.stringify({
        courseId,
        chapterId: actualChapterId || null,
      }));

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          chapterId: actualChapterId || null,
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
        console.error("[FlashcardsManager] Erreur détaillée de l'API:", JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          errorData
        }));
        throw new Error(errorData.error || errorData.details || errorData.hint || "Erreur lors de la création");
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
            <span className="ml-2 text-sm text-white/60">Chargement des flashcards...</span>
          </div>
        ) : (flashcards.length === 0 && localFlashcards.length === 0) ? (
          <div className="py-8 text-center text-sm text-white/60">
            <p>Aucune flashcard.</p>
            <p className="mt-2 text-xs text-white/40">
              {chapterId ? "Les flashcards apparaîtront ici une fois le chapitre sauvegardé." : "Cliquez sur 'Ajouter' pour en créer une."}
            </p>
          </div>
        ) : (
          [...flashcards, ...localFlashcards.filter((f: any) => chapterId && (f.chapter_id as any) === chapterId)].map((flashcard) => (
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

