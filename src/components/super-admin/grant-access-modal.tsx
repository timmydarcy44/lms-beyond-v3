"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type GrantAccessModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGranted: () => void;
};

type Organization = {
  id: string;
  name: string;
};

type CatalogItem = {
  id: string;
  title: string;
  item_type: string;
};

export function GrantAccessModal({ open, onOpenChange, onGranted }: GrantAccessModalProps) {
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [grantReason, setGrantReason] = useState<string>("");

  useEffect(() => {
    if (open) {
      // Charger les organisations et items
      Promise.all([
        fetch("/api/super-admin/organizations").then((r) => r.json()),
        fetch("/api/super-admin/catalogue/items").then((r) => r.json()),
      ])
        .then(([orgsData, itemsData]) => {
          if (orgsData.organizations) setOrganizations(orgsData.organizations);
          if (itemsData.items) setCatalogItems(itemsData.items);
        })
        .catch((error) => {
          console.error("[grant-access] Error loading data:", error);
        });
    }
  }, [open]);

  const handleGrant = async () => {
    if (!selectedOrg || !selectedItem) {
      toast.error("Veuillez sélectionner une organisation et un contenu");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/super-admin/catalogue/access/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organization_id: selectedOrg,
          catalog_item_id: selectedItem,
          grant_reason: grantReason || "Accès accordé manuellement",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'octroi de l'accès");
      }

      toast.success("Accès accordé avec succès");
      onGranted();
      onOpenChange(false);
      // Reset
      setSelectedOrg("");
      setSelectedItem("");
      setGrantReason("");
    } catch (error) {
      console.error("[grant-access] Error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'octroi de l'accès");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Accorder un accès au catalogue</DialogTitle>
          <DialogDescription className="text-gray-600">
            Accordez un accès gratuit à une organisation pour un contenu du catalogue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="organization" className="text-gray-700">
              Organisation *
            </Label>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="bg-gray-50 border-black text-gray-900">
                <SelectValue placeholder="Sélectionner une organisation" />
              </SelectTrigger>
              <SelectContent className="bg-white border-black">
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="catalog_item" className="text-gray-700">
              Contenu du catalogue *
            </Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger className="bg-gray-50 border-black text-gray-900">
                <SelectValue placeholder="Sélectionner un contenu" />
              </SelectTrigger>
              <SelectContent className="bg-white border-black">
                {catalogItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.title} ({item.item_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grant_reason" className="text-gray-700">
              Raison (optionnel)
            </Label>
            <Textarea
              id="grant_reason"
              value={grantReason}
              onChange={(e) => setGrantReason(e.target.value)}
              placeholder="Ex: Partenaire, Beta test, Promotion..."
              className="min-h-[80px] resize-none bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="border border-black text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </Button>
          <Button
            onClick={handleGrant}
            disabled={loading || !selectedOrg || !selectedItem}
            className="bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white"
          >
            {loading ? "Traitement..." : "Accorder l'accès"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}








