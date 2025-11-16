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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, BookOpen, Route, FileText, ClipboardList, Plus } from "lucide-react";

type AddCatalogItemModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: "module" | "parcours" | "ressource" | "test";
};

type ExistingContent = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

export function AddCatalogItemModal({
  open,
  onOpenChange,
  itemType,
}: AddCatalogItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [existingContent, setExistingContent] = useState<ExistingContent[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [selectedContentId, setSelectedContentId] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    short_description: "",
    hero_image_url: "",
    thumbnail_url: "",
    is_free: true, // Toujours gratuit avec modèle d'abonnement
    category: "",
    thematique: "",
    duration: "",
    level: "",
    is_featured: false,
    target_audience: "pro" as "pro" | "apprenant" | "all",
  });

  // Charger les contenus existants selon le type
  useEffect(() => {
    if (open) {
      loadExistingContent();
    }
  }, [open, itemType]);

  async function loadExistingContent() {
    setLoadingContent(true);
    try {
      let endpoint = "";
      switch (itemType) {
        case "module":
          endpoint = "/api/super-admin/catalogue/existing-content?type=courses";
          break;
        case "parcours":
          endpoint = "/api/super-admin/catalogue/existing-content?type=paths";
          break;
        case "ressource":
          endpoint = "/api/super-admin/catalogue/existing-content?type=resources";
          break;
        case "test":
          endpoint = "/api/super-admin/catalogue/existing-content?type=tests";
          break;
      }

      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.content) {
        setExistingContent(data.content);
      }
    } catch (error) {
      console.error("[add-catalog-item] Error loading content:", error);
      toast.error("Erreur lors du chargement des contenus");
    } finally {
      setLoadingContent(false);
    }
  }

  const handleContentSelect = async (contentId: string) => {
    setSelectedContentId(contentId);
    
    // Charger les détails du contenu pour pré-remplir le formulaire
    try {
      const response = await fetch(
        `/api/super-admin/catalogue/content-details?type=${itemType}&contentId=${contentId}`
      );
      const data = await response.json();
      
      if (data.content) {
        const details = data.content;
        setFormData((prev) => ({
          ...prev,
          title: details.title || "",
          description: details.description || "",
          short_description: details.short_description || details.description || "",
          hero_image_url: details.hero_image_url || "",
          thumbnail_url: details.thumbnail_url || "",
          category: details.category || "",
          duration: details.duration || "",
          level: details.level || "",
          target_audience: details.target_audience || "pro",
        }));
      } else {
        // Fallback: utiliser les données basiques
        const content = existingContent.find((c) => c.id === contentId);
        if (content) {
          setFormData((prev) => ({
            ...prev,
            title: content.title || "",
          }));
        }
      }
    } catch (error) {
      console.error("[add-catalog-item] Error loading content details:", error);
      // Fallback: utiliser les données basiques
      const content = existingContent.find((c) => c.id === contentId);
      if (content) {
        setFormData((prev) => ({
          ...prev,
          title: content.title || "",
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContentId) {
      toast.error("Veuillez sélectionner un contenu");
      return;
    }

    setLoading(true);

    try {
      // Utiliser les données du contenu sélectionné directement
      const selectedContent = existingContent.find((c) => c.id === selectedContentId);
      
      const response = await fetch("/api/super-admin/catalogue/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_type: itemType,
          content_id: selectedContentId,
          title: formData.title || selectedContent?.title || "",
          description: formData.description || "",
          short_description: formData.short_description || formData.description || "",
          hero_image_url: formData.hero_image_url || "",
          thumbnail_url: formData.thumbnail_url || "",
          price: 0, // Modèle d'abonnement : pas de prix unitaire
          is_free: true, // Toujours gratuit avec modèle d'abonnement
          category: formData.category || "",
          thematique: formData.thematique || "",
          duration: formData.duration || "",
          level: formData.level || "",
          is_featured: formData.is_featured,
          target_audience: formData.target_audience,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || "Erreur lors de l'ajout";
        const errorDetails = data.details ? ` (${data.details})` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      toast.success("Item ajouté au catalogue avec succès");
      onOpenChange(false);
      // Réinitialiser le formulaire
      setSelectedContentId("");
      setFormData({
        title: "",
        description: "",
        short_description: "",
        hero_image_url: "",
        thumbnail_url: "",
        is_free: true,
        category: "",
        thematique: "",
        duration: "",
        level: "",
        is_featured: false,
        target_audience: "pro",
      });
    } catch (error) {
      console.error("[add-catalog-item] Error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ajout");
    } finally {
      setLoading(false);
    }
  };

  const typeLabels = {
    module: "Module",
    parcours: "Parcours",
    ressource: "Ressource",
    test: "Test",
  };

  const typeIcons = {
    module: BookOpen,
    parcours: Route,
    ressource: FileText,
    test: ClipboardList,
  };

  const TypeIcon = typeIcons[itemType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <TypeIcon className="h-5 w-5" />
            Ajouter un {typeLabels[itemType]} au catalogue
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Sélectionnez un contenu existant créé par Super Admin, puis configurez ses informations pour le catalogue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Sélection du contenu existant */}
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">
              Sélectionner un contenu existant *
            </Label>
            {loadingContent ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-600">Chargement des contenus...</span>
              </div>
            ) : existingContent.length === 0 ? (
              <div className="rounded-lg border border-black bg-gray-50 p-6 text-center">
                <TypeIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">
                  Aucun {typeLabels[itemType]} trouvé.
                </p>
                <p className="text-xs text-gray-500">
                  Créez d&apos;abord un {typeLabels[itemType]} depuis le Studio de création.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 max-h-[300px] overflow-y-auto">
                {existingContent.map((content) => (
                  <button
                    key={content.id}
                    type="button"
                    onClick={() => handleContentSelect(content.id)}
                    className={`flex items-start justify-between p-4 rounded-lg border-2 transition-all text-left ${
                      selectedContentId === content.id
                        ? "border-black bg-gray-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <TypeIcon className="h-4 w-4 text-gray-600" />
                        <h4 className="font-semibold text-gray-900">{content.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          className={
                            content.status === "published"
                              ? "bg-green-100 text-green-700 border-black"
                              : "bg-gray-100 text-gray-700 border-black"
                          }
                        >
                          {content.status === "published" ? "Publié" : "Brouillon"}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(content.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </div>
                    {selectedContentId === content.id && (
                      <div className="ml-4 rounded-full bg-black text-white p-1">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bouton de soumission simplifié - juste cliquer sur le contenu */}
          {selectedContentId && (
            <div className="border-t border-gray-200 pt-4">
              <div className="rounded-lg bg-gray-50 p-4 border border-black">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Contenu sélectionné:</strong> {formData.title || existingContent.find(c => c.id === selectedContentId)?.title}
                </p>
                <p className="text-xs text-gray-500">
                  Cliquez sur "Ajouter au catalogue" pour ajouter ce contenu avec les informations par défaut.
                </p>
              </div>
            </div>
          )}

          {/* Informations du catalogue (masquées par défaut, optionnelles) */}
          {false && selectedContentId && (
            <>
              <div className="border-t border-gray-200 pt-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Informations pour le catalogue</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-700">
                      Titre dans le catalogue *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Titre du contenu"
                      required
                      className="bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target_audience" className="text-gray-700">
                      Public cible *
                    </Label>
                    <Select
                      value={formData.target_audience}
                      onValueChange={(value: "pro" | "apprenant" | "all") =>
                        setFormData({ ...formData, target_audience: value })
                      }
                    >
                      <SelectTrigger className="bg-gray-50 border-black text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-black">
                        <SelectItem value="pro">
                          Professionnels (CFA, entreprises, formateurs)
                        </SelectItem>
                        <SelectItem value="apprenant">Apprenants (étudiants)</SelectItem>
                        <SelectItem value="all">Tous publics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short_description" className="text-gray-700">
                    Description courte *
                  </Label>
                  <Textarea
                    id="short_description"
                    value={formData.short_description}
                    onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                    placeholder="Description courte affichée dans le catalogue"
                    required
                    className="min-h-[80px] resize-none bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-700">
                    Description complète
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description détaillée"
                    className="min-h-[120px] resize-none bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hero_image_url" className="text-gray-700">
                      Image Hero (URL)
                    </Label>
                    <Input
                      id="hero_image_url"
                      value={formData.hero_image_url}
                      onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                      placeholder="https://..."
                      className="bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thumbnail_url" className="text-gray-700">
                      Miniature (URL)
                    </Label>
                    <Input
                      id="thumbnail_url"
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                      placeholder="https://..."
                      className="bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="thematique" className="text-gray-700">
                      Thématique *
                    </Label>
                    <Select
                      value={formData.thematique}
                      onValueChange={(value) => setFormData({ ...formData, thematique: value })}
                    >
                      <SelectTrigger className="bg-gray-50 border-black text-gray-900">
                        <SelectValue placeholder="Sélectionner une thématique" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-black">
                        <SelectItem value="RH">RH</SelectItem>
                        <SelectItem value="BTS">BTS</SelectItem>
                        <SelectItem value="Commerce">Commerce</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Communication">Communication</SelectItem>
                        <SelectItem value="Management">Management</SelectItem>
                        <SelectItem value="Leadership">Leadership</SelectItem>
                        <SelectItem value="Neurosciences">Neurosciences</SelectItem>
                        <SelectItem value="Pédagogie">Pédagogie</SelectItem>
                        <SelectItem value="Vente">Vente</SelectItem>
                        <SelectItem value="Développement personnel">Développement personnel</SelectItem>
                        <SelectItem value="Entrepreneuriat">Entrepreneuriat</SelectItem>
                        <SelectItem value="Digital">Digital</SelectItem>
                        <SelectItem value="Innovation">Innovation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <CategorySelectField
                    value={formData.category}
                    onChange={(value) => setFormData({ ...formData, category: value })}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="level" className="text-gray-700">
                      Niveau
                    </Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => setFormData({ ...formData, level: value })}
                    >
                      <SelectTrigger className="bg-gray-50 border-black text-gray-900">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-black">
                        <SelectItem value="débutant">Débutant</SelectItem>
                        <SelectItem value="intermédiaire">Intermédiaire</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_free}
                      onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                      className="rounded border-black"
                    />
                    <span className="text-sm text-gray-700">Gratuit</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded border-black"
                    />
                    <span className="text-sm text-gray-700">Mettre en vedette</span>
                  </label>
                </div>
              </div>
            </>
          )}

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
              type="submit"
              disabled={loading || !selectedContentId}
              className="bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white"
            >
              {loading ? "Ajout..." : "Ajouter au catalogue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Composant pour la sélection de catégorie avec support personnalisé
function CategorySelectField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [categories, setCategories] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch("/api/super-admin/categories");
        const data = await response.json();
        if (data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error("[category-select] Error loading categories:", error);
        // Fallback par défaut pour contentin.cabinet@gmail.com
        setCategories(["TDAH", "DYS", "Guidance parentale", "Apprentissage", "Neuropsychologie", "Troubles de l'apprentissage", "Parentalité", "Éducation"]);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const handleCustomCategory = () => {
    if (customCategory.trim()) {
      onChange(customCategory.trim());
      setShowCustomInput(false);
      setCustomCategory("");
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="text-gray-700">Catégorie (optionnel)</Label>
        <div className="bg-gray-50 border-black h-10 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-gray-700">Catégorie (optionnel)</Label>
      <div className="flex gap-2">
        <Select
          value={value || undefined}
          onValueChange={onChange}
        >
          <SelectTrigger className="bg-gray-50 border-black text-gray-900 flex-1">
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent className="bg-white border-black">
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat} className="text-gray-900 hover:bg-gray-100 focus:bg-gray-100">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowCustomInput(!showCustomInput)}
          className="border-black text-gray-900 hover:bg-gray-50"
          title="Ajouter une catégorie personnalisée"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {showCustomInput && (
        <div className="flex gap-2">
          <Input
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="Nouvelle catégorie..."
            className="bg-gray-50 border-black text-gray-900 placeholder:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCustomCategory();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleCustomCategory}
            className="bg-black text-white hover:bg-gray-900"
          >
            Ajouter
          </Button>
        </div>
      )}
    </div>
  );
}
