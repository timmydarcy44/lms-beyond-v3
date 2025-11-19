"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

type CategorySelectFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
};

export function CategorySelectField({ value, onChange, label = "Catégorie", className }: CategorySelectFieldProps) {
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
        // Fallback par défaut avec "soft skills" ajouté
        setCategories([
          "TDAH", 
          "DYS", 
          "Guidance parentale", 
          "Apprentissage", 
          "Neuropsychologie", 
          "Troubles de l'apprentissage", 
          "Parentalité", 
          "Éducation",
          "Soft skills"
        ]);
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
          <span className="text-xs uppercase tracking-wider text-gray-500">{label}</span>
          <div className="bg-gray-50 border-gray-300 h-10 rounded animate-pulse" />
        </label>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className || ""}`}>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs uppercase tracking-wider text-gray-500">{label}</span>
        <div className="flex gap-2">
          <Select
            value={value || undefined}
            onValueChange={onChange}
          >
            <SelectTrigger className="bg-white border-gray-300 text-gray-900 flex-1">
              <SelectValue placeholder="Sélectionner une catégorie" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
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
            className="border-gray-300 text-gray-900 hover:bg-gray-50"
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
              className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
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
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              Ajouter
            </Button>
          </div>
        )}
      </label>
    </div>
  );
}





