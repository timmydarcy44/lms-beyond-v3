"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCourseBuilder } from "@/hooks/use-course-builder";

export function CourseMetadataForm() {
  const searchParams = useSearchParams();
  const general = useCourseBuilder((state) => state.snapshot.general);
  const updateGeneral = useCourseBuilder((state) => state.updateGeneral);
  
  // Initialiser le titre depuis les query params si disponible
  useEffect(() => {
    const titleParam = searchParams.get("title");
    if (titleParam && !general.title) {
      updateGeneral({ title: decodeURIComponent(titleParam) });
    }
  }, [searchParams, general.title, updateGeneral]);
  const objectives = useCourseBuilder((state) => state.snapshot.objectives);
  const skills = useCourseBuilder((state) => state.snapshot.skills);
  const addObjective = useCourseBuilder((state) => state.addObjective);
  const removeObjective = useCourseBuilder((state) => state.removeObjective);
  const addSkill = useCourseBuilder((state) => state.addSkill);
  const removeSkill = useCourseBuilder((state) => state.removeSkill);

  const [objectiveDraft, setObjectiveDraft] = useState("");
  const [skillDraft, setSkillDraft] = useState("");

  const handleObjectiveSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!objectiveDraft.trim()) return;
    addObjective(objectiveDraft.trim());
    setObjectiveDraft("");
  };

  const handleSkillSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!skillDraft.trim()) return;
    addSkill(skillDraft.trim());
    setSkillDraft("");
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Informations principales</CardTitle>
          <p className="text-sm text-white/60">
            Ces informations alimentent la page de présentation apprenant. Soignez le titre, le sous-titre et les visuels.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Titre de la formation"
            placeholder="NeuroDesign intensif"
            value={general.title}
            onChange={(value) => updateGeneral({ title: value })}
          />
          <CategorySelectField
            label="Catégorie"
            value={general.category}
            onChange={(value) => updateGeneral({ category: value })}
          />
          <InputField
            label="Niveau"
            placeholder="Débutant, Intermédiaire, Expert"
            value={general.level}
            onChange={(value) => updateGeneral({ level: value })}
          />
          <InputField
            label="Durée / rythme"
            placeholder="6 semaines, 12h, auto-rythmé…"
            value={general.duration}
            onChange={(value) => updateGeneral({ duration: value })}
          />
          <div className="md:col-span-2">
            <TextareaField
              label="Accroche / sous-titre"
              placeholder="Déclenchez l'engagement émotionnel et boostez la mémorisation"
              value={general.subtitle}
              onChange={(value) => updateGeneral({ subtitle: value })}
            />
          </div>
          <InputField
            label="Image hero (URL)"
            placeholder="https://images.unsplash.com/..."
            value={general.heroImage}
            onChange={(value) => updateGeneral({ heroImage: value })}
          />
          <InputField
            label="Vidéo trailer (URL)"
            placeholder="https://storage.googleapis.com/..."
            value={general.trailerUrl}
            onChange={(value) => updateGeneral({ trailerUrl: value })}
          />
          <InputField
            label="Badge — titre"
            placeholder="Badge Neuro Insights"
            value={general.badgeLabel}
            onChange={(value) => updateGeneral({ badgeLabel: value })}
          />
          <InputField
            label="Badge — description"
            placeholder="Atteste de votre maîtrise des leviers attentionnels et émotionnels."
            value={general.badgeDescription}
            onChange={(value) => updateGeneral({ badgeDescription: value })}
          />
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Objectifs pédagogiques</CardTitle>
          <p className="text-sm text-white/60">Les apprenants les retrouveront dans la page de présentation.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleObjectiveSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <Input
                value={objectiveDraft}
                onChange={(event) => setObjectiveDraft(event.target.value)}
                placeholder="Écrire un objectif clair et actionnable"
                className="bg-white/5 text-sm text-white placeholder:text-white/30"
              />
            </div>
            <Button type="submit" className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              Ajouter
            </Button>
          </form>
          <div className="space-y-2">
            {objectives.length ? (
              objectives.map((objective) => (
                <ObjectiveChip key={objective} value={objective} onRemove={() => removeObjective(objective)} />
              ))
            ) : (
              <p className="text-sm text-white/50">Ajoutez au moins 3 objectifs pour guider vos apprenants.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Compétences développées</CardTitle>
          <p className="text-sm text-white/60">Utilisées pour les badges et la preview apprenant.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSkillSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <Input
                value={skillDraft}
                onChange={(event) => setSkillDraft(event.target.value)}
                placeholder="Ex : Conception pédagogique"
                className="bg-white/5 text-sm text-white placeholder:text-white/30"
              />
            </div>
            <Button type="submit" className="rounded-full bg-gradient-to-r from-[#FF512F] to-[#DD2476] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              Ajouter
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {skills.length ? (
              skills.map((skill) => (
                <Badge
                  key={skill}
                  className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70"
                >
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="text-white/40 transition hover:text-white">✕</button>
                </Badge>
              ))
            ) : (
              <p className="text-sm text-white/50">Ajoutez les compétences clés travaillées dans ce parcours.</p>
            )}
          </div>
          <div className="pt-4">
            <Button
              asChild
              className="rounded-full bg-gradient-to-r from-[#00C6FF] to-[#0072FF] px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            >
              <Link href="/dashboard/formateur/formations/new/structure">Passer à la construction</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
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
      <span className="uppercase tracking-[0.3em] text-white/40">{label}</span>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="bg-white/5 text-sm text-white placeholder:text-white/30"
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
      <span className="uppercase tracking-[0.3em] text-white/40">{label}</span>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[120px] resize-none bg-white/5 text-sm text-white placeholder:text-white/30"
      />
    </label>
  );
}

function CategorySelectField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const categories = [
    "Business & Sales",
    "RH & Coaching",
    "Marketing & Communication",
    "Soft Skills",
    "IA & Data",
    "Pédagogie",
    "Leadership",
    "Développement personnel",
  ];

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="uppercase tracking-[0.3em] text-white/40">{label}</span>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="bg-white/5 text-sm text-white border-white/10">
          <SelectValue placeholder="Sélectionner une catégorie" />
        </SelectTrigger>
        <SelectContent className="bg-[#1A1A1A] border-white/10">
          {categories.map((category) => (
            <SelectItem
              key={category}
              value={category}
              className="text-white hover:bg-white/10 focus:bg-white/10"
            >
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function ObjectiveChip({ value, onRemove }: { value: string; onRemove: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-sm text-white/70">{value}</p>
      <button type="button" onClick={onRemove} className="text-sm text-white/40 transition hover:text-white">
        ✕
      </button>
    </div>
  );
}

