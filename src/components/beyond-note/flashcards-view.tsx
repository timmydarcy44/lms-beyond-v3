"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
}

interface FlashcardsViewProps {
  documentId: string;
  accountType: string;
  onClose: () => void;
}

export function FlashcardsView({ documentId, accountType, onClose }: FlashcardsViewProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const total = flashcards.length;

  useEffect(() => {
    const loadFlashcards = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/beyond-note/flashcards?document_id=${documentId}`);
        if (!res.ok) throw new Error("Erreur lors du chargement des flashcards");
        const data = await res.json();
        setFlashcards(data.flashcards || []);
        setFlippedCards(new Set());
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur serveur";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    loadFlashcards();
  }, [documentId]);

  const generateFlashcards = async () => {
    setGenerating(true);
    try {
      const docRes = await fetch("/api/beyond-note/documents");
      if (!docRes.ok) throw new Error("Impossible de récupérer le document");
      const docData = await docRes.json();
      const doc = docData.documents?.find((d: { id: string; extracted_text: string | null }) => d.id === documentId);
      if (!doc?.extracted_text) {
        toast.error("Aucun texte disponible");
        return;
      }

      const aiRes = await fetch("/api/beyond-note/ai-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, action: "flashcards", text: doc.extracted_text }),
      });
      if (!aiRes.ok) throw new Error("Erreur lors de la génération");
      const aiData = await aiRes.json();

      let parsed: Array<{ question: string; answer: string }> = [];
      try {
        parsed = JSON.parse(aiData.result);
      } catch {
        throw new Error("Réponse IA invalide");
      }

      const saveRes = await fetch("/api/beyond-note/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: documentId, flashcards: parsed }),
      });
      if (!saveRes.ok) throw new Error("Erreur lors de l'enregistrement");
      const saveData = await saveRes.json();
      setFlashcards(saveData.flashcards || []);
      setFlippedCards(new Set());
      toast.success("Flashcards générées");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur serveur";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleReview = async (cardId: string, decision: "known" | "review") => {
    try {
      await fetch("/api/beyond-note/flashcards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cardId, decision }),
      });
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0F] text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="text-lg font-semibold">Flashcards</div>
        <div className="flex items-center gap-4 text-sm text-white/50">
          <span>{total}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFlippedCards(new Set())}
            className="border-white/20 text-white hover:bg-white/5"
            disabled={flippedCards.size === 0}
          >
            Tout réinitialiser
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-10 min-h-[70vh]">
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-[#6D28D9]" />
        ) : total === 0 ? (
          <div className="text-center max-w-md">
            <p className="text-white/70 mb-6">Aucune flashcard disponible.</p>
            {accountType !== "child" && (
              <Button
                onClick={generateFlashcards}
                disabled={generating}
                className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white"
              >
                {generating ? "Génération..." : "Générer les flashcards"}
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {flashcards.map((card) => {
                const isFlipped = flippedCards.has(card.id);
                return (
                  <div
                    key={card.id}
                    onClick={() => {
                      setFlippedCards((prev) => {
                        const next = new Set(prev);
                        if (next.has(card.id)) {
                          next.delete(card.id);
                        } else {
                          next.add(card.id);
                        }
                        return next;
                      });
                    }}
                    className={`rounded-2xl border min-h-[140px] p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                      isFlipped
                        ? "bg-violet-500/20 border-violet-500/40"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    {isFlipped ? (
                      <>
                        <div className="text-xs font-medium text-violet-300 uppercase tracking-wide">
                          Réponse
                        </div>
                        <div className="text-white/90 text-sm leading-relaxed mt-2">
                          {card.answer}
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReview(card.id, "known");
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 text-xs"
                          >
                            Je savais ✓
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReview(card.id, "review");
                            }}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 text-xs"
                          >
                            À revoir ↺
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-center text-white text-sm leading-relaxed">
                        {card.question}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
