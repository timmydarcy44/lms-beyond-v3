"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

const TEST_CONTENT_ID = "test-confiance-en-soi";

type GrantUserAccessModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGranted: () => void;
};

export function GrantUserAccessModal({
  open,
  onOpenChange,
  onGranted,
}: GrantUserAccessModalProps) {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGrant = async () => {
    if (!email.trim()) {
      toast.error("Veuillez entrer un email");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/super-admin/catalogue/grant-user-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: email.trim(),
          contentId: TEST_CONTENT_ID,
          reason: reason.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'attribution de l'accès");
      }

      toast.success(`Accès accordé à ${email}`);
      setEmail("");
      setReason("");
      onOpenChange(false);
      onGranted();
    } catch (error) {
      console.error("[grant-user-access] Error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'attribution de l'accès");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Accorder un accès gratuit au test</DialogTitle>
          <DialogDescription>
            Donnez accès gratuitement au Test de Confiance en soi à un utilisateur.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email de l'utilisateur</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="exemple@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Raison (optionnel)</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Client fidèle, promotion spéciale..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
              disabled={loading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleGrant}
            disabled={loading || !email.trim()}
            className="bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Accorder l'accès
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

