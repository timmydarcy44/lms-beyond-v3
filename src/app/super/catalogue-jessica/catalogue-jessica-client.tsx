"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  FileText, 
  BookOpen, 
  ClipboardList, 
  Route,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const bgColor = "#F8F5F0";
const textColor = "#2F2A25";
const primaryColor = "#C6A664";
const secondaryColor = "#E6D9C6";

type CatalogItem = {
  id: string;
  title: string;
  item_type: "module" | "ressource" | "test" | "parcours";
  content_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type CatalogueJessicaClientProps = {
  items: CatalogItem[];
  jessicaProfileId: string;
};

export function CatalogueJessicaClient({ items, jessicaProfileId }: CatalogueJessicaClientProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const getItemIcon = (type: string) => {
    switch (type) {
      case "module":
        return <BookOpen className="h-5 w-5" style={{ color: primaryColor }} />;
      case "ressource":
        return <FileText className="h-5 w-5" style={{ color: primaryColor }} />;
      case "test":
        return <ClipboardList className="h-5 w-5" style={{ color: primaryColor }} />;
      case "parcours":
        return <Route className="h-5 w-5" style={{ color: primaryColor }} />;
      default:
        return <Package className="h-5 w-5" style={{ color: primaryColor }} />;
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case "module":
        return "Module";
      case "ressource":
        return "Ressource";
      case "test":
        return "Test";
      case "parcours":
        return "Parcours";
      default:
        return type;
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    setDeletingId(itemToDelete.id);
    try {
      const response = await fetch(`/api/catalog/items/${itemToDelete.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      toast.success("Contenu supprimé avec succès");
      router.refresh();
    } catch (error: any) {
      console.error("[CatalogueJessicaClient] Error deleting:", error);
      toast.error(error.message || "Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  const handleToggleActive = async (item: CatalogItem) => {
    setTogglingId(item.id);
    try {
      const response = await fetch(`/api/catalog/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: !item.is_active,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la modification");
      }

      toast.success(`Contenu ${!item.is_active ? "activé" : "désactivé"} avec succès`);
      router.refresh();
    } catch (error: any) {
      console.error("[CatalogueJessicaClient] Error toggling:", error);
      toast.error(error.message || "Erreur lors de la modification");
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (item: CatalogItem) => {
    // Rediriger vers la page d'édition appropriée selon le type
    if (item.item_type === "module") {
      router.push(`/super/studio/modules/${item.content_id}/structure`);
    } else if (item.item_type === "ressource") {
      router.push(`/super/studio/ressources/${item.content_id}/edit`);
    } else if (item.item_type === "test") {
      router.push(`/super/studio/tests/${item.content_id || item.id}/edit`);
    } else if (item.item_type === "parcours") {
      router.push(`/dashboard/paths/${item.content_id}/edit`);
    }
  };

  const openDeleteDialog = (item: CatalogItem) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const getItemUrl = (item: CatalogItem): string | undefined => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr";
    if (item.item_type === "ressource") {
      return `${baseUrl}/ressources/${item.content_id || item.id}`;
    } else if (item.item_type === "module") {
      return `${baseUrl}/formations/${item.content_id || item.id}`;
    } else if (item.item_type === "test") {
      return `${baseUrl}/dashboard/catalogue/test/${item.content_id || item.id}`;
    }
    return undefined;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-4xl font-bold mb-2"
            style={{ color: textColor }}
          >
            Catalogue
          </h1>
          <p 
            className="text-lg"
            style={{ color: textColor, opacity: 0.7 }}
          >
            Gérez vos ressources, modules, tests et parcours
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card style={{ backgroundColor: "#FFFFFF", borderColor: secondaryColor }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>Total</p>
                  <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                    {items.length}
                  </p>
                </div>
                <Package className="h-8 w-8" style={{ color: primaryColor, opacity: 0.3 }} />
              </div>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: "#FFFFFF", borderColor: secondaryColor }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>Ressources</p>
                  <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                    {items.filter(i => i.item_type === "ressource").length}
                  </p>
                </div>
                <FileText className="h-8 w-8" style={{ color: primaryColor, opacity: 0.3 }} />
              </div>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: "#FFFFFF", borderColor: secondaryColor }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>Modules</p>
                  <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                    {items.filter(i => i.item_type === "module").length}
                  </p>
                </div>
                <BookOpen className="h-8 w-8" style={{ color: primaryColor, opacity: 0.3 }} />
              </div>
            </CardContent>
          </Card>
          <Card style={{ backgroundColor: "#FFFFFF", borderColor: secondaryColor }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>Tests</p>
                  <p className="text-2xl font-bold" style={{ color: primaryColor }}>
                    {items.filter(i => i.item_type === "test").length}
                  </p>
                </div>
                <ClipboardList className="h-8 w-8" style={{ color: primaryColor, opacity: 0.3 }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des items */}
        <div className="space-y-4">
          {items.length === 0 ? (
            <Card style={{ backgroundColor: "#FFFFFF", borderColor: secondaryColor }}>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4" style={{ color: primaryColor, opacity: 0.3 }} />
                <p className="text-lg" style={{ color: textColor, opacity: 0.7 }}>
                  Aucun contenu dans le catalogue
                </p>
              </CardContent>
            </Card>
          ) : (
            items.map((item) => (
              <Card 
                key={item.id}
                style={{ 
                  backgroundColor: "#FFFFFF", 
                  borderColor: secondaryColor,
                  opacity: item.is_active ? 1 : 0.6
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-lg" style={{ backgroundColor: `${primaryColor}20` }}>
                        {getItemIcon(item.item_type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold" style={{ color: textColor }}>
                            {item.title}
                          </h3>
                          <span 
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ 
                              backgroundColor: `${primaryColor}20`,
                              color: primaryColor
                            }}
                          >
                            {getItemTypeLabel(item.item_type)}
                          </span>
                          {!item.is_active && (
                            <span 
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{ 
                                backgroundColor: "#EF444420",
                                color: "#EF4444"
                              }}
                            >
                              Inactif
                            </span>
                          )}
                        </div>
                        <p className="text-sm" style={{ color: textColor, opacity: 0.6 }}>
                          Créé le {new Date(item.created_at).toLocaleDateString("fr-FR")}
                        </p>
                        {getItemUrl(item) && (
                          <a
                            href={getItemUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm mt-2 inline-block"
                            style={{ color: primaryColor }}
                          >
                            Voir sur le site →
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(item)}
                        disabled={togglingId === item.id}
                        style={{ borderColor: secondaryColor, color: textColor }}
                      >
                        {togglingId === item.id ? (
                          "⏳"
                        ) : item.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        style={{ borderColor: secondaryColor, color: textColor }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(item)}
                        disabled={deletingId === item.id}
                        style={{ borderColor: "#EF4444", color: "#EF4444" }}
                      >
                        {deletingId === item.id ? (
                          "⏳"
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent style={{ backgroundColor: "#FFFFFF", borderColor: secondaryColor }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: textColor }}>
              Supprimer le contenu
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: textColor, opacity: 0.7 }}>
              Êtes-vous sûr de vouloir supprimer "{itemToDelete?.title}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              style={{ borderColor: secondaryColor, color: textColor }}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              style={{ backgroundColor: "#EF4444", color: "white" }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

