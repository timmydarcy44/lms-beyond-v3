"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { toast } from "sonner";

type Experience = {
  id?: string;
  title: string;
  company: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  location?: string;
};

type ExperienceFormProps = {
  experience?: Experience;
  onSave: () => void;
  onCancel: () => void;
};

export function ExperienceForm({ experience, onSave, onCancel }: ExperienceFormProps) {
  const [formData, setFormData] = useState<Experience>({
    title: experience?.title || "",
    company: experience?.company || "",
    description: experience?.description || "",
    start_date: experience?.start_date || "",
    end_date: experience?.end_date || "",
    is_current: experience?.is_current || false,
    location: experience?.location || "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = experience?.id
        ? `/api/beyond-connect/experiences/${experience.id}`
        : "/api/beyond-connect/experiences";
      const method = experience?.id ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la sauvegarde");
      }

      toast.success(experience?.id ? "Expérience mise à jour" : "Expérience ajoutée");
      onSave();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {experience?.id ? "Modifier l'expérience" : "Nouvelle expérience"}
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="title" className="text-gray-900">
            Poste *
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="bg-white text-gray-900 border-gray-300"
          />
        </div>

        <div>
          <Label htmlFor="company" className="text-gray-900">
            Entreprise *
          </Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            required
            className="bg-white text-gray-900 border-gray-300"
          />
        </div>

        <div>
          <Label htmlFor="location" className="text-gray-900">
            Lieu
          </Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="bg-white text-gray-900 border-gray-300"
          />
        </div>

        <div>
          <Label htmlFor="start_date" className="text-gray-900">
            Date de début *
          </Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
            className="bg-white text-gray-900 border-gray-300"
          />
        </div>

        <div>
          <Label htmlFor="end_date" className="text-gray-900">
            Date de fin
          </Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            disabled={formData.is_current}
            className="bg-white text-gray-900 border-gray-300"
          />
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <Checkbox
            id="is_current"
            checked={formData.is_current}
            onCheckedChange={(checked) => {
              setFormData({
                ...formData,
                is_current: checked as boolean,
                end_date: checked ? undefined : formData.end_date,
              });
            }}
          />
          <Label htmlFor="is_current" className="text-gray-900 cursor-pointer">
            Poste actuel
          </Label>
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="text-gray-900">
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="bg-white text-gray-900 border-gray-300"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="border-gray-300 text-gray-700">
          Annuler
        </Button>
        <Button type="submit" disabled={loading} className="bg-[#003087] hover:bg-[#002a6b] text-white">
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

