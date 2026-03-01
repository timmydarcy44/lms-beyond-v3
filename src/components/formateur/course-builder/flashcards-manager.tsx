"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, Save, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import { cn } from "@/lib/utils";

type Flashcard = {
  id: string;
  front: string;
  back: string;
  course_id?: string | null;
  chapter_id?: string | null;
  created_at?: string;
  updated_at?: string;
  isLocal?: boolean;
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
  const [isOpen, setIsOpen] = useState(false);
  
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
            const filtered = parsed
              .filter((f: any) => (f.chapter_id as any) === chapterId)
              .map((f: Flashcard) => ({ ...f, isLocal: true }));
            console.log(
              "[FlashcardsManager] Loading local flashcards from localStorage for chapter:",
              chapterId,
              "count:",
              filtered.length,
            );
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
          isLocal: true,
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

      if (!actualChapterId) {
        console.log(
          "[FlashcardsManager] No chapter UUID available; skipping remote flashcards load and relying on local drafts.",
        );
        setFlashcards([]);
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.append("courseId", courseId);
      // Ne charger que les flashcards du chapitre spécifique si on a un UUID
      params.append("chapterId", actualChapterId);
      console.log("[FlashcardsManager] Loading flashcards for chapter:", actualChapterId);

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
      
      // IMPORTANT: Ne garder que les flashcards du chapitre actuel (et celles partagées course-wide)
      const filteredFlashcards =
        data.flashcards?.filter(
          (f: any) => f.chapter_id === actualChapterId || f.chapter_id === null,
        ) ?? [];
      console.log(
        "[FlashcardsManager] Filtered flashcards for chapter UUID:",
        actualChapterId,
        "->",
        filteredFlashcards.length,
        "flashcards",
      );

      console.log("[FlashcardsManager] Setting flashcards from DB:", filteredFlashcards.length);
      setFlashcards(filteredFlashcards.map((f: Flashcard) => ({ ...f, isLocal: false })));
      
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

      if (!actualChapterId) {
        const localFlashcard: Flashcard = {
          id: `local-${Date.now()}`,
          front: "Question",
          back: "Réponse",
          course_id: courseId ?? null,
          chapter_id: chapterId,
          created_at: new Date().toISOString(),
          isLocal: true,
        };

        setLocalFlashcards((prev) => [...prev, localFlashcard]);
        setEditingId(localFlashcard.id);
        setEditFront(localFlashcard.front);
        setEditBack(localFlashcard.back);
        setIsOpen(true);
        toast.success("Flashcard créée (en attente de sauvegarde)");
        return;
      }

      console.log(
        "[FlashcardsManager] Sending flashcard creation request:",
        JSON.stringify({
          courseId,
          chapterId: actualChapterId,
        }),
      );

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          chapterId: actualChapterId,
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
      setFlashcards((prev) => [...prev, { ...data.flashcard, isLocal: false }]);
      
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
      const localCard = localFlashcards.find((flashcard) => flashcard.id === id);
      if (localCard) {
        setLocalFlashcards((prev) =>
          prev.map((flashcard) =>
            flashcard.id === id
              ? {
                  ...flashcard,
                  front: editFront.trim(),
                  back: editBack.trim(),
                  updated_at: new Date().toISOString(),
                  isLocal: true,
                }
              : flashcard,
          ),
        );
        setEditingId(null);
        toast.success("Flashcard sauvegardée (en attente de publication)");
        return;
      }

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
      setFlashcards((prev) =>
        prev.map((f) => (f.id === id ? { ...data.flashcard, isLocal: false } : f)),
      );
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
      const isLocalCard = localFlashcards.some((flashcard) => flashcard.id === id);
      if (isLocalCard) {
        setLocalFlashcards((prev) => prev.filter((flashcard) => flashcard.id !== id));
        if (editingId === id) {
          setEditingId(null);
        }
        toast.success("Flashcard supprimée (brouillon)");
        return;
      }

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

  const scopedLocalFlashcards = chapterId
    ? localFlashcards.filter((flashcard) => (flashcard.chapter_id as unknown as string) === chapterId)
    : localFlashcards;

  const displayedFlashcards = [...flashcards, ...scopedLocalFlashcards];
  const totalFlashcards = displayedFlashcards.length;

  if (!courseId) {
    return (
      <Card className="border border-orange-500/30 bg-slate-950 text-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Flashcards</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center text-sm text-slate-300">
          <p className="mb-2">Sauvegardez d’abord la formation pour activer les flashcards.</p>
          <p className="text-xs text-slate-500">Les cartes générées automatiquement seront disponibles après l’enregistrement.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-orange-500/40 bg-slate-950 text-white shadow-sm">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              Flashcards{" "}
              <span className="ml-2 rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-300">
                {totalFlashcards}
              </span>
            </CardTitle>
            <p className="text-xs text-slate-400">
              Créez des cartes mémoires pour ancrer les points clés de votre chapitre.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen((prev) => !prev)}
              className={cn(
                "flex items-center gap-2 rounded-full border-orange-500/40 bg-transparent px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-orange-300 hover:bg-orange-500/10",
                !totalFlashcards && "cursor-not-allowed opacity-60",
              )}
              disabled={!totalFlashcards}
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen ? "rotate-180" : "")} />
              {isOpen ? "Masquer" : "Voir les flashcards"}
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isSaving}
              className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 hover:bg-orange-400 disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-2 h-3.5 w-3.5" />
              )}
              Ajouter
            </Button>
          </div>
        </div>
        {!totalFlashcards && (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-xs text-orange-200">
            Commencez par créer une flashcard ou générez-les via l’IA depuis l’éditeur pour alimenter ce module.
          </div>
        )}
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-orange-200">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Chargement des flashcards…
            </div>
          ) : totalFlashcards === 0 ? (
            <div className="rounded-xl border border-orange-500/20 bg-slate-900/60 px-4 py-10 text-center text-sm text-slate-300">
              Aucune flashcard enregistrée pour l’instant.
            </div>
          ) : (
            displayedFlashcards.map((flashcard) => (
              <div
                key={flashcard.id}
                className="rounded-2xl border border-orange-500/30 bg-slate-900/80 p-4 shadow-sm"
              >
                {editingId === flashcard.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-300">
                        Question (Recto)
                      </label>
                      <Textarea
                        value={editFront}
                        onChange={(e) => setEditFront(e.target.value)}
                        className="min-h-[80px] border border-orange-500/30 bg-slate-950/80 text-sm text-orange-50"
                        placeholder="Question..."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-300">
                        Réponse (Verso)
                      </label>
                      <Textarea
                        value={editBack}
                        onChange={(e) => setEditBack(e.target.value)}
                        className="min-h-[80px] border border-orange-500/30 bg-slate-950/80 text-sm text-orange-50"
                        placeholder="Réponse..."
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleSave(flashcard.id)}
                        disabled={isSaving}
                        className="rounded-full bg-orange-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 hover:bg-orange-400 disabled:opacity-60"
                      >
                        {isSaving ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Enregistrer
                      </Button>
                      <Button
                        onClick={handleCancel}
                        disabled={isSaving}
                        variant="ghost"
                        className="rounded-full border border-orange-500/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-orange-200 hover:bg-orange-500/10 disabled:opacity-60"
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-400">
                          Question
                        </span>
                        <p className="mt-1 text-sm text-slate-100">{flashcard.front}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-orange-400">
                          Réponse
                        </span>
                        <p className="mt-1 text-sm text-slate-200">{flashcard.back}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleEdit(flashcard)}
                        variant="ghost"
                        size="sm"
                        className="rounded-full border border-orange-500/30 px-3 py-1.5 text-orange-200 hover:bg-orange-500/10"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(flashcard.id)}
                        variant="ghost"
                        size="sm"
                        className="rounded-full border border-orange-500/30 px-3 py-1.5 text-orange-200 hover:bg-red-500/20 hover:text-red-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      )}
    </Card>
  );
}

