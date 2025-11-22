"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Organization = {
  id: string;
  name: string;
};

type CatalogContentAssignmentModalProps = {
  contentId: string;
  contentType: "module" | "parcours" | "ressource" | "test";
  contentTitle: string;
  open: boolean;
  onClose: () => void;
};

export function CatalogContentAssignmentModal({
  contentId,
  contentType,
  contentTitle,
  open,
  onClose,
}: CatalogContentAssignmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    if (open) {
      fetchOrganizations();
    } else {
      setSelectedOrgs(new Set());
    }
  }, [open]);

  const fetchOrganizations = async () => {
    setFetching(true);
    try {
      const response = await fetch("/api/super-admin/organizations");
      if (!response.ok) throw new Error("Erreur lors de la récupération des organisations");
      const data = await response.json();
      setOrganizations(data.organizations || []);
    } catch (error) {
      console.error("[catalog-assignment] Error fetching organizations:", error);
      toast.error("Erreur lors de la récupération des organisations");
    } finally {
      setFetching(false);
    }
  };

  const handleToggleOrg = (orgId: string) => {
    const newSelected = new Set(selectedOrgs);
    if (newSelected.has(orgId)) {
      newSelected.delete(orgId);
    } else {
      newSelected.add(orgId);
    }
    setSelectedOrgs(newSelected);
  };

  const handleAssign = async () => {
    if (selectedOrgs.size === 0) {
      toast.error("Veuillez sélectionner au moins une organisation");
      return;
    }

    setLoading(true);
    try {
      // Assigner le contenu à chaque organisation sélectionnée
      const assignments = Array.from(selectedOrgs).map((orgId) =>
        fetch("/api/super-admin/assign-content-to-organization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizationId: orgId,
            contentIds: [contentId],
          }),
        })
      );

      const results = await Promise.all(assignments);
      const errors = results.filter((r) => !r.ok);

      if (errors.length > 0) {
        throw new Error(`${errors.length} assignation(s) ont échoué`);
      }

      toast.success(`${contentTitle} assigné à ${selectedOrgs.size} organisation(s)`);
      onClose();
      setSelectedOrgs(new Set());
    } catch (error) {
      console.error("[catalog-assignment] Error assigning content:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'assignation");
    } finally {
      setLoading(false);
    }
  };

  const contentTypeLabels = {
    module: "Formation",
    parcours: "Parcours",
    ressource: "Ressource",
    test: "Test",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assigner {contentTypeLabels[contentType]} à des organisations</DialogTitle>
          <DialogDescription>
            Sélectionnez les organisations auxquelles assigner "{contentTitle}".
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
            {organizations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">Aucune organisation disponible</p>
              </div>
            ) : (
              organizations.map((org) => (
                <label
                  key={org.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedOrgs.has(org.id)}
                    onCheckedChange={() => handleToggleOrg(org.id)}
                  />
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-gray-600">
            {selectedOrgs.size} organisation(s) sélectionnée(s)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handleAssign} disabled={loading || selectedOrgs.size === 0}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assignation...
                </>
              ) : (
                `Assigner ${selectedOrgs.size > 0 ? `(${selectedOrgs.size})` : ""}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}







