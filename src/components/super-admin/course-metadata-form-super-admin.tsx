"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import { ImageUploadModal } from "./image-upload-modal";
import { VideoUploadModal } from "./video-upload-modal";
import { OpenBadgeModal } from "./open-badge-modal";
import { BadgeCheck, Image as ImageIcon, Video as VideoIcon, Plus } from "lucide-react";
import { calculateCourseDuration } from "@/lib/utils/course-duration";

export function CourseMetadataFormSuperAdmin() {
  const snapshot = useCourseBuilder((state) => state.snapshot);
  const general = snapshot.general;
  const updateGeneral = useCourseBuilder((state) => state.updateGeneral);
  const objectives = useCourseBuilder((state) => state.snapshot.objectives);
  const skills = useCourseBuilder((state) => state.snapshot.skills);
  const addObjective = useCourseBuilder((state) => state.addObjective);
  const removeObjective = useCourseBuilder((state) => state.removeObjective);
  const addSkill = useCourseBuilder((state) => state.addSkill);
  const removeSkill = useCourseBuilder((state) => state.removeSkill);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isHeroImageModalOpen, setIsHeroImageModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isBadgeImageModalOpen, setIsBadgeImageModalOpen] = useState(false);
  const [objectiveDraft, setObjectiveDraft] = useState("");
  const [skillDraft, setSkillDraft] = useState("");

  // Calculer automatiquement la durée lorsque le contenu change
  useEffect(() => {
    // Calculer uniquement si on a du contenu
    if (snapshot.sections && snapshot.sections.length > 0) {
      const calculatedDuration = calculateCourseDuration(snapshot);
      // Mettre à jour seulement si la durée n'a pas été modifiée manuellement
      // ou si elle est vide ou "À déterminer"
      if (!general.duration || general.duration === "À déterminer" || general.duration === "") {
        updateGeneral({ duration: calculatedDuration });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(snapshot.sections)]);

  return (
    <div className="space-y-6">
      <Card className="border-black bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 pb-4 border-b border-black/10">
          <CardTitle className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Informations principales
          </CardTitle>
          <p className="text-sm text-gray-600">
            Ces informations alimentent la page de présentation apprenant. Soignez le titre, le sous-titre et les visuels.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 pt-6">
          <InputField
            label="Titre de la formation"
            placeholder="NeuroDesign intensif"
            value={general.title}
            onChange={(value) => updateGeneral({ title: value })}
          />
          <CategorySelectField
            value={general.category || ""}
            onChange={(value) => updateGeneral({ category: value })}
          />
          <InputField
            label="Niveau"
            placeholder="Débutant, Intermédiaire, Expert"
            value={general.level}
            onChange={(value) => updateGeneral({ level: value })}
          />
          <div className="space-y-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">Durée / rythme</span>
              <Input
                value={general.duration || ""}
                onChange={(e) => updateGeneral({ duration: e.target.value })}
                placeholder="Calcul automatique..."
                className="bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                La durée est calculée automatiquement en fonction du contenu du module.
              </p>
            </label>
          </div>
          <div className="md:col-span-2">
            <TextareaField
              label="Accroche / sous-titre"
              placeholder="Déclenchez l'engagement émotionnel et boostez la mémorisation"
              value={general.subtitle}
              onChange={(value) => updateGeneral({ subtitle: value })}
            />
          </div>
          <div className="space-y-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">Prix (€)</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={general.price || ""}
                onChange={(e) => updateGeneral({ price: e.target.value ? parseFloat(e.target.value) : 0 })}
                placeholder="0.00"
                className="bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
              />
              <p className="text-xs text-gray-500 mt-1">
                Laissez 0€ pour un contenu gratuit (affiché comme "OFFERT").
              </p>
            </label>
          </div>
          <div className="md:col-span-2">
            <TextareaField
              label="Description"
              placeholder="Description détaillée du module qui sera affichée sous l'image hero sur la page de présentation..."
              value={general.description || ""}
              onChange={(value) => updateGeneral({ description: value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">Image hero (ou GIF animé)</span>
              {!general.heroImage ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsHeroImageModalOpen(true)}
                  className="w-full border-black text-gray-900 hover:bg-gray-100 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une image
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-lg border border-black bg-gray-50 p-3">
                    <img 
                      src={general.heroImage} 
                      alt="Aperçu hero" 
                      className="h-32 w-full rounded object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsHeroImageModalOpen(true)}
                    className="w-full border-black text-gray-900 hover:bg-gray-100 flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Modifier l'image
                  </Button>
                </div>
              )}
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">Vidéo trailer (optionnel)</span>
              {!general.trailerUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="w-full border-black text-gray-900 hover:bg-gray-100 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une vidéo
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-lg border border-black bg-gray-50 p-3">
                    <p className="text-xs text-gray-500 mb-2">URL configurée :</p>
                    <p className="text-sm text-gray-700 truncate">{general.trailerUrl}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsVideoModalOpen(true)}
                    className="w-full border-black text-gray-900 hover:bg-gray-100 flex items-center justify-center gap-2"
                  >
                    <VideoIcon className="h-4 w-4" />
                    Modifier la vidéo
                  </Button>
                </div>
              )}
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-medium mb-2">
                Badge — titre
              </span>
              <div className="flex items-center gap-3">
                <Input
                  value={general.badgeLabel || ""}
                  onChange={(e) => updateGeneral({ badgeLabel: e.target.value })}
                  placeholder="Badge Neuro Insights"
                  className="bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
                  readOnly
                />
                <Button
                  type="button"
                  onClick={() => setIsBadgeModalOpen(true)}
                  className="rounded-full bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
                >
                  <BadgeCheck className="h-4 w-4 mr-2" />
                  Créer un Open Badge
                </Button>
              </div>
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">
                Badge — image (optionnel)
              </span>
              <p className="text-xs text-gray-500">
                Ajoutez une image ou un GIF pour votre badge. Si non fourni, un badge Open Badge standard sera généré.
              </p>
              {!general.badgeImage ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBadgeImageModalOpen(true)}
                  className="w-full border-black text-gray-900 hover:bg-gray-100 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter une image de badge
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-lg border border-black bg-gray-50 p-3 inline-block">
                    <img 
                      src={general.badgeImage} 
                      alt="Aperçu du badge" 
                      className="h-20 w-20 rounded-lg border border-black object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsBadgeImageModalOpen(true)}
                    className="w-full border-black text-gray-900 hover:bg-gray-100 flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Modifier l'image du badge
                  </Button>
                </div>
              )}
            </label>
          </div>
          <InputField
            label="Badge — description"
            placeholder="Atteste de votre maîtrise des leviers attentionnels et émotionnels."
            value={general.badgeDescription}
            onChange={(value) => updateGeneral({ badgeDescription: value })}
          />
          <div className="md:col-span-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-medium mb-2">Public cible *</span>
              <SelectField
                value={general.target_audience || "pro"}
                onChange={(value) => updateGeneral({ target_audience: value as "pro" | "apprenant" | "all" })}
                options={[
                  { value: "pro", label: "Professionnels (CFA, entreprises, formateurs)" },
                  { value: "apprenant", label: "Apprenants (étudiants)" },
                  { value: "all", label: "Tous publics" },
                ]}
              />
              <p className="text-xs text-gray-500 mt-1">
                Cette option détermine qui peut voir ce module dans le catalogue.
              </p>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Objectifs pédagogiques et Compétences développées */}
      <Card className="border-black bg-white shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 pb-4 border-b border-black/10">
          <CardTitle className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Objectifs pédagogiques & Compétences développées
          </CardTitle>
          <p className="text-sm text-gray-600">
            Ces informations apparaîtront sur la page de présentation du module pour guider les apprenants.
          </p>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 pt-6">
          {/* Objectifs pédagogiques */}
          <div className="space-y-4">
            <label className="flex flex-col gap-2 text-sm">
              <span className="uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">
                Objectifs pédagogiques
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (objectiveDraft.trim()) {
                    addObjective(objectiveDraft.trim());
                    setObjectiveDraft("");
                  }
                }}
                className="flex gap-2"
              >
                <Input
                  value={objectiveDraft}
                  onChange={(e) => setObjectiveDraft(e.target.value)}
                  placeholder="Écrire un objectif clair et actionnable"
                  className="bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
                />
                <Button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
                >
                  Ajouter
                </Button>
              </form>
              <div className="space-y-2">
                {objectives.length > 0 ? (
                  objectives.map((objective) => (
                    <div
                      key={objective}
                      className="flex items-start justify-between gap-3 rounded-xl border border-black bg-gradient-to-r from-gray-50 to-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm text-gray-700 flex-1">{objective}</p>
                      <button
                        type="button"
                        onClick={() => removeObjective(objective)}
                        className="text-sm text-gray-400 hover:text-gray-900 transition-colors flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">Ajoutez au moins 3 objectifs pour guider vos apprenants.</p>
                )}
              </div>
            </label>
          </div>

          {/* Compétences développées */}
          <div className="space-y-4">
            <label className="flex flex-col gap-2 text-sm">
              <span className="uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">
                Compétences développées
              </span>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (skillDraft.trim()) {
                    addSkill(skillDraft.trim());
                    setSkillDraft("");
                  }
                }}
                className="flex gap-2"
              >
                <Input
                  value={skillDraft}
                  onChange={(e) => setSkillDraft(e.target.value)}
                  placeholder="Ex : Conception pédagogique"
                  className="bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
                />
                <Button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
                >
                  Ajouter
                </Button>
              </form>
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <Badge
                      key={skill}
                      className="flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 border border-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-gray-900"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-gray-400 hover:text-gray-900 transition-colors"
                      >
                        ✕
                      </button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">Ajoutez les compétences clés travaillées dans ce module.</p>
                )}
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      <OpenBadgeModal
        open={isBadgeModalOpen}
        onOpenChange={setIsBadgeModalOpen}
        onSave={(badge) => {
          updateGeneral({ 
            badgeLabel: badge.name,
            badgeDescription: badge.description,
            badgeImage: badge.imageUrl || general.badgeImage || "",
          });
        }}
        initialName={general.badgeLabel || ""}
        initialDescription={general.badgeDescription || ""}
        initialImageUrl={general.badgeImage || ""}
      />

      <ImageUploadModal
        open={isHeroImageModalOpen}
        onOpenChange={setIsHeroImageModalOpen}
        value={general.heroImage || ""}
        onChange={(url) => updateGeneral({ heroImage: url })}
        title="Image hero (ou GIF animé)"
        accept="image/*,.gif"
      />

      <VideoUploadModal
        open={isVideoModalOpen}
        onOpenChange={setIsVideoModalOpen}
        value={general.trailerUrl || ""}
        onChange={(url) => updateGeneral({ trailerUrl: url })}
        title="Vidéo trailer"
      />

      <ImageUploadModal
        open={isBadgeImageModalOpen}
        onOpenChange={setIsBadgeImageModalOpen}
        value={general.badgeImage || ""}
        onChange={(url) => updateGeneral({ badgeImage: url })}
        title="Image du badge"
        accept="image/*,.gif"
      />
    </div>
  );
}

function InputField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
      />
    </label>
  );
}

function TextareaField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">{label}</span>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[120px] resize-none bg-gray-50 border-black text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-black"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-gray-50 border-black text-gray-900">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-white border-black">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
        <label className="flex flex-col gap-1 text-sm">
          <span className="uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">Catégorie</span>
          <div className="bg-gray-50 border-black h-10 rounded animate-pulse" />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="flex flex-col gap-1 text-sm">
        <span className="uppercase tracking-[0.3em] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-medium">Catégorie</span>
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
          <div className="flex gap-2 mt-2">
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
      </label>
    </div>
  );
}

function ObjectiveChip({ value, onRemove }: { value: string; onRemove: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-black bg-gradient-to-r from-gray-50 to-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-sm text-gray-700">{value}</p>
      <button 
        type="button" 
        onClick={onRemove} 
        className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

