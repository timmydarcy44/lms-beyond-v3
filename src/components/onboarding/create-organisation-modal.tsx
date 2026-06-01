"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PipelineDeal } from "@/lib/crm/pipeline-shared";

type CreateOrganisationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: PipelineDeal;
  onSuccess?: (organizationId: string) => void;
};

export function CreateOrganisationModal({
  open,
  onOpenChange,
  deal,
  onSuccess,
}: CreateOrganisationModalProps) {
  const [companyName, setCompanyName] = useState(deal.company_name ?? "");
  const [drhEmail, setDrhEmail] = useState(deal.email ?? "");
  const [drhName, setDrhName] = useState(deal.contact_first_name ?? "");
  const [estimatedUsers, setEstimatedUsers] = useState(
    deal.estimated_users != null ? String(deal.estimated_users) : "",
  );
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!companyName.trim() || !drhEmail.trim() || !drhName.trim()) {
      toast.error("Remplissez les champs obligatoires");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/create-organisation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName.trim(),
          drh_email: drhEmail.trim(),
          drh_name: drhName.trim(),
          estimated_users: estimatedUsers ? Number(estimatedUsers) : null,
          deal_id: deal.id,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        hint?: string;
        organisation_id?: string;
        organization_id?: string;
      };
      if (!res.ok) {
        const msg = [json.error, json.hint].filter(Boolean).join(" — ");
        throw new Error(msg || "Erreur");
      }
      const orgId = json.organisation_id ?? json.organization_id;
      toast.success("Organisation créée — invitation envoyée au DRH");
      onOpenChange(false);
      if (orgId) onSuccess?.(orgId);
      window.dispatchEvent(new CustomEvent("crm-updated"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Création impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>🚀 Créer l&apos;organisation Beyond</DialogTitle>
          <DialogDescription>
            Crée l&apos;espace client, envoie l&apos;invitation au DRH et lie le deal CRM.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom de l&apos;entreprise *</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email du DRH / Admin * (invitation envoyée)</Label>
            <Input type="email" value={drhEmail} onChange={(e) => setDrhEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Prénom et nom du DRH *</Label>
            <Input value={drhName} onChange={(e) => setDrhName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Nombre de salariés estimé</Label>
            <Input
              type="number"
              min={1}
              value={estimatedUsers}
              onChange={(e) => setEstimatedUsers(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={() => void submit()} disabled={loading}>
            {loading ? "Création…" : "Créer l'organisation →"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
