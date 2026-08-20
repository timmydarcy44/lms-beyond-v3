"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseFetchJson } from "@/lib/api/parse-fetch-json";

export function PipelineQualiopiStartOverlay({
  open,
  onOpenChange,
  deal,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: { id: string; company_name: string } | null;
  onDone: () => void | Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!deal?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/super-admin/crm/qualiopi/sessions/${deal.id}/start`, {
        method: "POST",
      });
      const json = await parseFetchJson<{ error?: string; email_failures?: { email: string }[] }>(res);
      if (!res.ok) throw new Error(json.error ?? "Impossible de démarrer la formation");
      toast.success("Liens d’émargement et livret d’accueil envoyés");
      if (json.email_failures?.length) {
        toast.error(`Échec d’envoi : ${json.email_failures.map((item) => item.email).join(", ")}`);
      }
      onOpenChange(false);
      await onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Formation en cours — {deal?.company_name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">
          Envoi automatique du livret d’accueil et d’un lien d’émargement à chaque collaborateur invité. La
          signature est horodatée (jour + heure) dans l’onglet Qualiopi.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={() => void submit()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Envoyer émargement + livret
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
