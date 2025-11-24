"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, Layers, BookOpen, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

type ContentItem = {
  id: string;
  title: string;
  type: "course" | "path" | "resource" | "test";
  status?: string | null;
};

type OrganizationContentAssignmentModalProps = {
  organizationId: string;
  organizationName: string;
  open: boolean;
  onClose: () => void;
};

export function OrganizationContentAssignmentModal({
  organizationId,
  organizationName,
  open,
  onClose,
}: OrganizationContentAssignmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [content, setContent] = useState<{
    courses: ContentItem[];
    paths: ContentItem[];
    resources: ContentItem[];
    tests: ContentItem[];
  }>({
    courses: [],
    paths: [],
    resources: [],
    tests: [],
  });

  useEffect(() => {
    if (open) {
      fetchContent();
    } else {
      setSelectedItems(new Set());
    }
  }, [open]);

  const fetchContent = async () => {
    setFetching(true);
    try {
      const response = await fetch("/api/super-admin/organization-assignable-content");
      if (!response.ok) throw new Error("Erreur lors de la récupération du contenu");
      const data = await response.json();
      setContent(data);
    } catch (error) {
      console.error("[org-assignment] Error fetching content:", error);
      toast.error("Erreur lors de la récupération du contenu");
    } finally {
      setFetching(false);
    }
  };

  const handleToggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleAssign = async () => {
    if (selectedItems.size === 0) {
      toast.error("Veuillez sélectionner au moins un élément");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/super-admin/assign-content-to-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          contentIds: Array.from(selectedItems),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'assignation");
      }

      toast.success(`${selectedItems.size} élément(s) assigné(s) à ${organizationName}`);
      onClose();
      setSelectedItems(new Set());
    } catch (error) {
      console.error("[org-assignment] Error assigning content:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'assignation");
    } finally {
      setLoading(false);
    }
  };

  const renderContentSection = (
    title: string,
    items: ContentItem[],
    icon: React.ComponentType<{ className?: string }>,
    type: "course" | "path" | "resource" | "test"
  ) => {
    if (items.length === 0) return null;

    const Icon = icon;
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title} ({items.length})
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {items.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
            >
              <Checkbox
                checked={selectedItems.has(item.id)}
                onCheckedChange={() => handleToggleItem(item.id)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                {item.status && (
                  <p className="text-xs text-gray-500">{item.status}</p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assigner du contenu à {organizationName}</DialogTitle>
          <DialogDescription>
            Sélectionnez les formations, parcours, ressources et tests à assigner à cette organisation.
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {renderContentSection("Formations", content.courses, GraduationCap, "course")}
            {renderContentSection("Parcours", content.paths, Layers, "path")}
            {renderContentSection("Ressources", content.resources, BookOpen, "resource")}
            {renderContentSection("Tests", content.tests, FileText, "test")}

            {content.courses.length === 0 &&
              content.paths.length === 0 &&
              content.resources.length === 0 &&
              content.tests.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">Aucun contenu disponible à assigner</p>
                </div>
              )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-gray-600">
            {selectedItems.size} élément(s) sélectionné(s)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handleAssign} disabled={loading || selectedItems.size === 0}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assignation...
                </>
              ) : (
                `Assigner ${selectedItems.size > 0 ? `(${selectedItems.size})` : ""}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}









