"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ContactSelector } from "@/components/messaging/contact-selector";
import type { Contact } from "@/lib/queries/contacts";

type NewMessageModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableContacts: Contact[];
  onSend: (data: { recipientId: string; subject: string; content: string }) => Promise<void>;
};

export function NewMessageModal({
  open,
  onOpenChange,
  availableContacts,
  onSend,
}: NewMessageModalProps) {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!selectedContactId) {
      setError("Veuillez sélectionner un destinataire");
      return;
    }

    if (!content.trim()) {
      setError("Veuillez saisir un message");
      return;
    }

    setError(null);
    setIsSending(true);

    try {
      await onSend({
        recipientId: selectedContactId,
        subject: subject.trim() || "Sans objet",
        content: content.trim(),
      });

      // Réinitialiser le formulaire
      setSelectedContactId(null);
      setSubject("");
      setContent("");
      onOpenChange(false);
    } catch (err) {
      console.error("[NewMessageModal] Error sending message:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi du message");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setSelectedContactId(null);
      setSubject("");
      setContent("");
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-[#141414] via-[#101010] to-[#050505] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            Écrire un nouveau message
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Remplissez les champs ci-dessous pour envoyer un message
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Destinataire */}
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-sm font-medium text-white">
              Destinataire <span className="text-red-400">*</span>
            </Label>
            <ContactSelector
              contacts={availableContacts}
              selectedContactId={selectedContactId}
              onSelectContact={setSelectedContactId}
              placeholder="Rechercher un contact..."
              className="bg-black/20 border-white/10 text-white"
            />
          </div>

          {/* Objet */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium text-white">
              Objet
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Sujet du message (optionnel)"
              className="bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-[#00C6FF]"
            />
          </div>

          {/* Corps du message */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium text-white">
              Corps du message <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Votre message..."
              rows={6}
              maxLength={10000}
              className="bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-[#00C6FF] resize-none max-h-[300px] overflow-y-auto"
            />
            <p className="text-xs text-white/50">
              {content.length} caractère{content.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="rounded-lg bg-red-500/20 border border-red-500/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSending}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSend}
              disabled={isSending || !selectedContactId || !content.trim()}
              className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-6 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-white shadow-lg shadow-[#00c6ff]/30 hover:shadow-[#00c6ff]/50 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

