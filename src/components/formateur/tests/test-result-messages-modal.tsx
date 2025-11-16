"use client";

import { useState, useTransition, useEffect } from "react";
import { MessageSquare, Loader2, Check, Sparkles, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ResultMessage = {
  id?: string;
  minScore: number;
  maxScore: number;
  title: string;
  message: string;
  aiGenerated?: boolean;
};

type TestResultMessagesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string;
  testTitle: string;
  initialMessages?: ResultMessage[];
  onSave: (messages: ResultMessage[]) => Promise<void>;
};

export function TestResultMessagesModal({
  open,
  onOpenChange,
  testId,
  testTitle,
  initialMessages = [],
  onSave,
}: TestResultMessagesModalProps) {
  const [messages, setMessages] = useState<ResultMessage[]>(initialMessages);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setMessages(initialMessages.length > 0 ? initialMessages : [
        { minScore: 0, maxScore: 50, title: "À améliorer", message: "" },
        { minScore: 51, maxScore: 75, title: "Bien", message: "" },
        { minScore: 76, maxScore: 100, title: "Excellent", message: "" },
      ]);
      setEditingIndex(null);
    }
  }, [open, initialMessages]);

  const generateWithAI = async (message: ResultMessage, index: number) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-test-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testTitle,
          minScore: message.minScore,
          maxScore: message.maxScore,
          title: message.title,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la génération");

      const data = await response.json();
      setMessages((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          message: data.message || data.feedback || "",
          title: data.title || next[index].title,
          aiGenerated: true,
        };
        return next;
      });
      toast.success("Message généré avec l'IA");
    } catch (error) {
      console.error("Error generating AI message:", error);
      toast.error("Erreur lors de la génération avec l'IA");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddMessage = () => {
    setMessages((prev) => [
      ...prev,
      {
        minScore: prev.length > 0 ? (prev[prev.length - 1].maxScore + 1) : 0,
        maxScore: 100,
        title: "Nouveau message",
        message: "",
      },
    ]);
    setEditingIndex(messages.length);
  };

  const handleRemoveMessage = (index: number) => {
    setMessages((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const handleUpdateMessage = (index: number, field: keyof ResultMessage, value: any) => {
    setMessages((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSave = () => {
    // Vérifier que tous les messages ont un message
    const incomplete = messages.find((m) => !m.message.trim());
    if (incomplete) {
      toast.error("Tous les messages doivent avoir un contenu");
      return;
    }

    startTransition(async () => {
      try {
        await onSave(messages);
        toast.success("Messages sauvegardés avec succès");
        onOpenChange(false);
      } catch (error) {
        toast.error("Erreur lors de la sauvegarde");
        console.error(error);
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      setMessages(initialMessages);
      setEditingIndex(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl bg-gray-900 text-white border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Messages personnalisés selon les résultats</DialogTitle>
          <DialogDescription className="text-white/60">
            Configurez des messages qui s&apos;afficheront aux apprenants selon leur score au test "{testTitle}".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-white/60">
                    Score: {message.minScore}% - {message.maxScore}%
                  </span>
                  {message.aiGenerated && (
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                      Généré par IA
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generateWithAI(message, index)}
                    disabled={isGenerating}
                    className="h-8 px-2 text-white/60 hover:text-white hover:bg-white/10"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    IA
                  </Button>
                  {messages.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMessage(index)}
                      className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Titre</Label>
                <Input
                  value={message.title}
                  onChange={(e) => handleUpdateMessage(index, "title", e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                  placeholder="Ex: Excellent travail !"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Message</Label>
                <Textarea
                  value={message.message}
                  onChange={(e) => handleUpdateMessage(index, "message", e.target.value)}
                  className="bg-white/5 border-white/20 text-white min-h-[100px]"
                  placeholder="Votre message personnalisé pour cette plage de score..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Score minimum (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={message.minScore}
                    onChange={(e) => handleUpdateMessage(index, "minScore", parseInt(e.target.value) || 0)}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Score maximum (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={message.maxScore}
                    onChange={(e) => handleUpdateMessage(index, "maxScore", parseInt(e.target.value) || 100)}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={handleAddMessage}
            className="w-full border-white/20 text-white/80 hover:bg-white/10"
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une plage de score
          </Button>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isPending}
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-gradient-to-r from-[#00C6FF] to-[#0072FF] text-white hover:opacity-90"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Sauvegarder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



