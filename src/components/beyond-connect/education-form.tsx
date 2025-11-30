"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type Education = {
  id?: string;
  degree: string;
  institution: string;
  field_of_study?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  grade?: string;
};

type EducationFormProps = {
  education?: Education;
  onSave: () => void;
  onCancel: () => void;
};

export function EducationForm({ education, onSave, onCancel }: EducationFormProps) {
  const [formData, setFormData] = useState<Education>({
    degree: education?.degree || "",
    institution: education?.institution || "",
    field_of_study: education?.field_of_study || "",
    description: education?.description || "",
    start_date: education?.start_date || "",
    end_date: education?.end_date || "",
    is_current: education?.is_current || false,
    grade: education?.grade || "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = education?.id
        ? `/api/beyond-connect/education/${education.id}`
        : "/api/beyond-connect/education";
      const method = education?.id ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      toast.success(education?.id ? "Formation mise à jour" : "Formation ajoutée");
      onSave();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div>
        <Label htmlFor="degree">Diplôme / Formation *</Label>
        <Input
          id="degree"
          value={formData.degree}
          onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
          placeholder="Ex: Master en Marketing"
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="institution">Établissement *</Label>
        <Input
          id="institution"
          value={formData.institution}
          onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
          placeholder="Ex: Université Paris-Sorbonne"
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="field_of_study">Domaine d'études</Label>
        <Input
          id="field_of_study"
          value={formData.field_of_study}
          onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
          placeholder="Ex: Marketing Digital"
          className="mt-1"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="start_date">Date de début</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="end_date">Date de fin</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            disabled={formData.is_current}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_current"
          checked={formData.is_current}
          onCheckedChange={(checked) => {
            setFormData({ ...formData, is_current: checked as boolean, end_date: checked ? "" : formData.end_date });
          }}
        />
        <Label htmlFor="is_current" className="cursor-pointer">
          Formation en cours
        </Label>
      </div>

      <div>
        <Label htmlFor="grade">Note / Mention</Label>
        <Input
          id="grade"
          value={formData.grade}
          onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
          placeholder="Ex: Mention Bien"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Décrivez votre formation..."
          rows={3}
          className="mt-1"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading} className="bg-[#003087] hover:bg-[#002a6b] text-white">
          {loading ? "Enregistrement..." : education?.id ? "Mettre à jour" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}

