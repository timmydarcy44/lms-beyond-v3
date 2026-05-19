"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/immutability */

import { useState, useEffect, useMemo } from "react";
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
  local_chapter_ref?: string | null;
  created_at?: string;
  updated_at?: string;
  isLocal?: boolean;
};

type FlashcardsManagerProps = {
  courseId?: string;
  chapterId?: string;
  scope?: "chapter" | "subchapter";
};

const isDbUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const chapterUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function FlashcardsManager({ courseId, chapterId, scope = "chapter" }: FlashcardsManagerProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [localFlashcards, setLocalFlashcards] = useState<Flashcard[]>([]); // Flashcards créées localement (pas encore en DB avec chapter_id)
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  
  // Utiliser le snapshot du store pour trouver l'UUID du chapitre
  const snapshot = useCourseBuilder((state) => state.snapshot);

  // Clé pour le localStorage
  const localStorageKey = chapterId ? `flashcards-${courseId ? courseId : "local"}-${chapterId}` : null;

  const effectiveCourseId = (() => {
    if (courseId) return courseId;
    try {
      const path = window.location.pathname;
      const m = path.match(/\/dashboard\/formateur\/formations\/([0-9a-f-]{36})/i);
      return m?.[1] ?? undefined;
    } catch {
      return undefined;
    }
  })();

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
        window.dispatchEvent(
          new CustomEvent("flashcards-storage-updated", { detail: { key: localStorageKey } }),
        );
      } catch (error) {
        console.warn("[FlashcardsManager] Error saving to localStorage:", error);
      }
    } else if (localStorageKey && localFlashcards.length === 0) {
      // Nettoyer le localStorage si plus de flashcards locales
      localStorage.removeItem(localStorageKey);
      window.dispatchEvent(
        new CustomEvent("flashcards-storage-updated", { detail: { key: localStorageKey } }),
      );
    }
  }, [localStorageKey, localFlashcards]);

  useEffect(() => {
    console.log("MANAGER COURSE ID:", courseId);
    if (courseId) {
      setFlashcards([]);
      if (chapterId) {
        void loadFlashcardsFromDB();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, chapterId, snapshot]);

  // Écouter les événements de création de flashcards pour les afficher immédiatement
  useEffect(() => {
    if (!chapterId) return;
    
    const handleFlashcardsCreated = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log("[FlashcardsManager] Event received: flashcards created", customEvent.detail);
      const eventDetail = customEvent.detail || {};
      const incomingScope =
        (eventDetail.builderScopeId as string | undefined) ??
        (eventDetail.builderChapterKey as string | undefined);
      if (incomingScope != null && chapterId != null && incomingScope !== chapterId) {
        return;
      }
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
          loadFlashcardsFromDB();
        }, 500);
      } else if (createdFlashcards.length > 0) {
        // Si les flashcards n'ont pas été sauvegardées (pas d'UUID de chapitre), les stocker localement
        const flashcardsWithChapter = createdFlashcards.map((f: any, index: number) => ({
          id: f.id || `temp-${Date.now()}-${index}`,
          front: f.question || f.front || "",
          back: f.answer || f.back || "",
          course_id: courseId ?? null,
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
        setIsOpen(true);
      }
      
      // Recharger aussi depuis la DB après un délai
      setTimeout(() => {
        console.log("[FlashcardsManager] Reloading flashcards from DB after creation...");
        loadFlashcardsFromDB();
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

  const loadFlashcardsFromDB = async () => {
    console.log("MANAGER COURSE ID:", courseId);
    if (!courseId) {
      console.log("[FlashcardsManager] No courseId, skipping load");
      return;
    }
    if (!chapterId) {
      setFlashcards([]);
      return;
    }

    setIsLoading(true);
    try {
      const base = `/api/flashcards?courseId=${encodeURIComponent(courseId)}`;
      const url = `${base}&scope=${encodeURIComponent(scope)}&chapterKey=${encodeURIComponent(chapterId)}`;

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const list = (data.flashcards ?? []) as Flashcard[];
      setFlashcards(list.map((f: Flashcard) => ({ ...f, isLocal: false })));
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

  const resolveActualChapterId = async (): Promise<string | null> => {
    if (!chapterId) return null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(chapterId)) return chapterId;

    try {
      const findResponse = await fetch("/api/chapters/find-by-local-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, localChapterId: chapterId }),
      });
      if (findResponse.ok) {
        const findData = await findResponse.json().catch(() => null);
        const found = String(findData?.chapterId ?? "").trim();
        if (found && uuidRegex.test(found)) return found;
      }
    } catch {
      // ignore
    }

    try {
      for (const section of snapshot.sections || []) {
        for (const chapter of section.chapters || []) {
          if (chapter.id === chapterId && (chapter as any).dbId && uuidRegex.test((chapter as any).dbId)) {
            return (chapter as any).dbId as string;
          }
          for (const sub of chapter.subchapters || []) {
            if (sub.id === chapterId && (sub as any).dbId && uuidRegex.test((sub as any).dbId)) {
              return (sub as any).dbId as string;
            }
          }
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  const handlePersistAll = async () => {
    const courseIdToUse = effectiveCourseId;
    if (!courseIdToUse) {
      toast.error("Sauvegarde impossible", { description: "courseId introuvable (prop + URL)." });
      return;
    }
    const actualChapterId = await resolveActualChapterId();

    const scoped = chapterId
      ? localFlashcards.filter((flashcard) => (flashcard.chapter_id as unknown as string) === chapterId)
      : localFlashcards;
    if (scoped.length === 0) {
      toast.message("Rien à sauvegarder", { description: "Aucune flashcard brouillon pour ce chapitre." });
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const builderChapterKey =
      chapterId && !uuidRegex.test(String(chapterId)) ? String(chapterId) : null;

    const flashcardsPayload = scoped
      .map((f) => {
        const q = String(f.front ?? (f as any).question ?? "").trim();
        const a = String(f.back ?? (f as any).answer ?? "").trim();
        const row: Record<string, string> = {
          front: q,
          back: a,
          question: q,
          answer: a,
        };
        if (isDbUuid(f.id)) row.id = f.id;
        return row;
      })
      .filter((row) => row.front.length > 0 && row.back.length > 0);

    if (flashcardsPayload.length === 0) {
      toast.error("Sauvegarde impossible", {
        description: "Aucune carte avec question et réponse non vides. Éditez les cartes puis réessayez.",
      });
      return;
    }

    const persistBody: Record<string, unknown> = {
      courseId: courseIdToUse,
      chapterId: actualChapterId ?? null,
      scope,
      flashcards: flashcardsPayload,
    };
    if (builderChapterKey) {
      persistBody.localChapterRef = builderChapterKey;
      persistBody.builderLocalChapterId = builderChapterKey;
    }

    setIsSaving(true);
    try {
      console.log("ENVOI FLASHCARDS:", persistBody);

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(persistBody),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(String(data?.error ?? `Erreur HTTP ${response.status}`));

      toast.success("Flashcards sauvegardées");
      setIsOpen(true);
      await loadFlashcardsFromDB();
      // Ne vider les brouillons qu’après rechargement DB (évite liste vide transitoire)
      setLocalFlashcards((prev) =>
        chapterId ? prev.filter((f: any) => (f.chapter_id as any) !== chapterId) : [],
      );
    } catch (e) {
      toast.error("Sauvegarde impossible", { description: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!courseId) {
      const localFlashcard: Flashcard = {
        id: `local-${Date.now()}`,
        front: "Question",
        back: "Réponse",
        course_id: null,
        chapter_id: chapterId ?? null,
        created_at: new Date().toISOString(),
        isLocal: true,
      };
      setLocalFlashcards((prev) => [...prev, localFlashcard]);
      setEditingId(localFlashcard.id);
      setEditFront(localFlashcard.front);
      setEditBack(localFlashcard.back);
      setIsOpen(true);
      toast.success("Flashcard créée (brouillon)", {
        description: "Sauvegardez la formation pour synchroniser vers Supabase.",
      });
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
          } catch {
            console.warn("[flashcards] Could not find chapter UUID for local ID:", chapterId);
          }
        }
      }

      if (!actualChapterId) {
        if (!chapterId) {
          const localFlashcard: Flashcard = {
            id: `local-${Date.now()}`,
            front: "Question",
            back: "Réponse",
            course_id: courseId ?? null,
            chapter_id: null,
            created_at: new Date().toISOString(),
            isLocal: true,
          };
          setLocalFlashcards((prev) => [...prev, localFlashcard]);
          setEditingId(localFlashcard.id);
          setEditFront(localFlashcard.front);
          setEditBack(localFlashcard.back);
          setIsOpen(true);
          toast.success("Flashcard créée (brouillon)", { description: "Sélectionnez un chapitre pour la lier." });
          return;
        }

        console.log(
          "[FlashcardsManager] Sending flashcard creation (builder id → local_chapter_ref):",
          JSON.stringify({ courseId, builderLocalChapterId: chapterId }),
        );

        const createLocalBody = {
          courseId,
          chapterId: null,
          scope,
          builderLocalChapterId: chapterId,
          localChapterRef: chapterId,
          question: "Question",
          answer: "Réponse",
          front: "Question",
          back: "Réponse",
        };
        console.log("ENVOI FLASHCARDS:", createLocalBody);

        const response = await fetch("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createLocalBody),
        });

        if (!response.ok) {
          let errorData: { error?: string; details?: string; hint?: string };
          try {
            const text = await response.text();
            try {
              errorData = JSON.parse(text) as { error?: string; details?: string; hint?: string };
            } catch {
              errorData = { error: text || `Erreur HTTP ${response.status}: ${response.statusText}` };
            }
          } catch {
            errorData = { error: `Erreur HTTP ${response.status}: ${response.statusText}` };
          }
          console.error("[FlashcardsManager] Erreur API (ref locale):", JSON.stringify(errorData));
          throw new Error(errorData.error || errorData.details || errorData.hint || "Erreur lors de la création");
        }

        const data = (await response.json()) as { flashcard?: Flashcard };
        if (!data?.flashcard) {
          throw new Error("La flashcard n'a pas été créée correctement.");
        }

        setFlashcards((prev) => [...prev, { ...data.flashcard, isLocal: false }]);
        setEditingId(data.flashcard.id);
        setEditFront(data.flashcard.front || "Question");
        setEditBack(data.flashcard.back || "Réponse");
        void loadFlashcardsFromDB();
        toast.success("Flashcard créée");
        return;
      }

      const uuidRegexCreate = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const builderKeyForUuid =
        chapterId && !uuidRegexCreate.test(String(chapterId)) ? String(chapterId) : null;

      const createUuidBody: Record<string, unknown> = {
        courseId,
        chapterId: actualChapterId,
        scope,
        question: "Question",
        answer: "Réponse",
        front: "Question",
        back: "Réponse",
      };
      if (builderKeyForUuid) {
        createUuidBody.localChapterRef = builderKeyForUuid;
        createUuidBody.builderLocalChapterId = builderKeyForUuid;
      }

      console.log("ENVOI FLASHCARDS:", createUuidBody);

      const response = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createUuidBody),
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
      loadFlashcardsFromDB().catch((error) => {
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
        invalidateFlashcardCounts();
        toast.success("Flashcard supprimée (brouillon)");
        return;
      }

      if (!isDbUuid(id)) {
        setFlashcards((prev) => prev.filter((f) => f.id !== id));
        if (editingId === id) setEditingId(null);
        invalidateFlashcardCounts();
        toast.success("Flashcard supprimée");
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

  const displayedFlashcards = useMemo(() => {
    const scopedLocal = !chapterId
      ? localFlashcards
      : localFlashcards.filter((f) => (f.chapter_id as unknown as string) === chapterId);
    const byId = new Map<string, Flashcard>();
    for (const f of flashcards) {
      byId.set(f.id, { ...f, isLocal: false });
    }
    for (const f of scopedLocal) {
      if (!byId.has(f.id)) {
        byId.set(f.id, { ...f, isLocal: true });
      }
    }
    return Array.from(byId.values()).sort((a, b) => {
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return ta - tb;
    });
  }, [flashcards, localFlashcards, chapterId]);

  const totalFlashcards = displayedFlashcards.length;

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
            {!courseId ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-orange-200/90">
                Mode brouillon — sauvegarde cours requise pour sync
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen((prev) => !prev)}
              className={cn(
                "flex items-center gap-2 rounded-full border-orange-500/40 bg-transparent px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-orange-300 hover:bg-orange-500/10",
              )}
            >
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen ? "rotate-180" : "")} />
              {isOpen ? "Masquer" : "Voir les flashcards"}
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-900 hover:bg-orange-400"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-2 h-3.5 w-3.5" />
              )}
              Ajouter
            </Button>
            <Button
              type="button"
              onClick={handlePersistAll}
              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-emerald-500"
            >
              <Save className="mr-2 h-3.5 w-3.5" />
              Sauvegarder en base
            </Button>
          </div>
        </div>
        {!totalFlashcards && (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-xs text-orange-200">
            Commencez par créer une flashcard ou générez-les via l’IA depuis l’éditeur pour alimenter ce module.
          </div>
        )}
        {!courseId && totalFlashcards > 0 ? (
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-xs text-orange-200">
            Vos flashcards sont visibles ici et stockées localement. Sauvegardez la formation pour les rendre accessibles aux apprenants.
          </div>
        ) : null}
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
                        type="button"
                        onClick={() => handleSave(flashcard.id)}
                        className="rounded-full bg-orange-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-950 hover:bg-orange-400"
                      >
                        {isSaving ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Enregistrer
                      </Button>
                      <Button
                        type="button"
                        onClick={handleCancel}
                        variant="ghost"
                        className="rounded-full border border-orange-500/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-orange-200 hover:bg-orange-500/10"
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
                        type="button"
                        onClick={() => handleEdit(flashcard)}
                        variant="ghost"
                        size="sm"
                        className="rounded-full border border-orange-500/30 px-3 py-1.5 text-orange-200 hover:bg-orange-500/10"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
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

