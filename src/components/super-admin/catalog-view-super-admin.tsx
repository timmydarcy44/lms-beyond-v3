"use client";

import { useEffect, useState } from "react";
import { Loader2, Edit, Trash2, Filter, Share2, ExternalLink, Brain } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CatalogContentAssignmentModal } from "./catalog-content-assignment-modal";

type CatalogItem = {
  id: string;
  content_id: string;
  item_type: "module" | "parcours" | "ressource" | "test";
  title: string;
  description: string | null;
  short_description: string | null;
  hero_image_url: string | null;
  thumbnail_url: string | null;
  price: number;
  is_free: boolean;
  category: string | null;
  duration: string | null;
  level: string | null;
  access_status?: "pending_payment" | "purchased" | "manually_granted" | "free";
  kind?: string | null;
  published?: boolean;
};

export function CatalogViewSuperAdmin() {
  const router = useRouter();
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToAssign, setItemToAssign] = useState<CatalogItem | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const response = await fetch("/api/super-admin/catalogue/all-content");
        const data = await response.json();
        
        if (data.items) {
          setCatalogItems(data.items);
        }
      } catch (error) {
        console.error("[catalogue] Error loading catalog:", error);
        toast.error("Erreur lors du chargement du catalogue");
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  // Extraire toutes les catégories uniques
  const categories = Array.from(
    new Set(catalogItems.map((item) => item.category || "Autres").filter(Boolean))
  ).sort();

  // Filtrer les items par catégorie
  const filteredItems = selectedCategory
    ? catalogItems.filter((item) => (item.category || "Autres") === selectedCategory)
    : catalogItems;

  // Fonction pour obtenir l'URL de modification selon le type
  const getEditUrl = (item: CatalogItem): string => {
    switch (item.item_type) {
      case "module":
        return `/super/studio/modules/${item.content_id}/structure`;
      case "parcours":
        return `/super/studio/parcours/${item.content_id}/edit`;
      case "ressource":
        return `/super/studio/ressources/${item.content_id}/edit`;
      case "test":
        return `/super/studio/tests/${item.content_id}/edit`;
      default:
        return "/super/catalogue";
    }
  };

  // Fonction pour supprimer un item
  const handleDelete = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/super-admin/catalogue/items/${itemToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      // Retirer l'item de la liste
      setCatalogItems(catalogItems.filter((item) => item.id !== itemToDelete.id));
      toast.success("Produit supprimé avec succès");
      setItemToDelete(null);
    } catch (error) {
      console.error("[catalogue] Error deleting item:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* En-tête avec titre et filtres */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          No School
        </h1>
        
        {/* Section Test Soft Skills */}
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Test Soft Skills – Profil 360</h3>
                <p className="text-sm text-gray-600">Questionnaire d'évaluation des compétences comportementales</p>
              </div>
            </div>
            <Link
              href="/dashboard/apprenant/questionnaires/4f1d7284-8684-4696-8d0e-59fd57160f86"
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <span>Accéder au test</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </div>
        
        {/* Filtres par catégorie */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>Filtrer par catégorie :</span>
          </div>
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="rounded-full"
          >
            Tous
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Gridview générale */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 border border-gray-200 rounded-2xl bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {selectedCategory ? `Aucun contenu dans la catégorie "${selectedCategory}"` : "Aucun contenu disponible"}
          </h2>
          <p className="text-gray-600">
            {selectedCategory 
              ? "Essayez une autre catégorie ou créez du nouveau contenu."
              : "Le catalogue sera bientôt rempli de contenus passionnants."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const typeColors = {
              module: "bg-blue-50 text-blue-700 border-blue-200",
              parcours: "bg-purple-50 text-purple-700 border-purple-200",
              ressource: "bg-green-50 text-green-700 border-green-200",
              test: "bg-orange-50 text-orange-700 border-orange-200",
            };

            const typeLabels = {
              module: "Module",
              parcours: "Parcours",
              ressource: "Ressource",
              test: "Test",
            };

            return (
              <div
                key={item.id}
                className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Image */}
                <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  {item.thumbnail_url || item.hero_image_url ? (
                    <img
                      src={item.thumbnail_url || item.hero_image_url || ""}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <span className="text-4xl font-semibold text-gray-400">
                        {item.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Badge type en haut à gauche */}
                  <div className="absolute top-2 left-2">
                    <Badge className={`${typeColors[item.item_type]} text-xs font-medium`}>
                      {typeLabels[item.item_type]}
                    </Badge>
                  </div>

                  {/* Badge prix en haut à droite */}
                  <div className="absolute top-2 right-2">
                    <Badge className={`${item.price === 0 || item.is_free ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-gray-900 text-white border-gray-900"} text-xs font-medium`}>
                      {item.price === 0 || item.is_free ? "OFFERT" : `${item.price.toFixed(2)}€`}
                    </Badge>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
                    {item.title}
                  </h3>
                  
                  {(item.short_description || item.description) && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {item.short_description || item.description}
                    </p>
                  )}

                  {/* Catégorie */}
                  {item.category && (
                    <div className="mb-3">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
                      onClick={() => router.push(getEditUrl(item))}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                      onClick={() => setItemToAssign(item)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => setItemToDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le produit</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{itemToDelete?.title}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal d'assignation de contenu */}
      {itemToAssign && (
        <CatalogContentAssignmentModal
          contentId={itemToAssign.content_id}
          contentType={itemToAssign.item_type}
          contentTitle={itemToAssign.title}
          open={!!itemToAssign}
          onClose={() => setItemToAssign(null)}
        />
      )}
    </div>
  );
}
