"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import { GLOBAL_SKILL_REFERENTIAL, referentialItemName } from "@/lib/profile/competency-referential";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";
import { cn } from "@/lib/utils";

const CONTRACT_TYPES = [
  "CDI",
  "CDD",
  "Alternance",
  "Stage",
  "Intérim",
  "Freelance",
  "Temps partiel",
] as const;

const EXPERIENCE_LEVELS = [
  "Non spécifiée",
  "Débutant / premier emploi",
  "1-2 ans",
  "3-5 ans",
  "5-10 ans",
  "10 ans et plus",
] as const;

const EDUCATION_LEVELS = [
  "Non requis",
  "Bac",
  "Bac+2",
  "Bac+3",
  "Bac+5",
  "Doctorat",
] as const;

const SOFT_SKILL_OPTIONS = SOFT_SKILLS.map((s) => s.titre);

const HARD_SKILL_OPTIONS = Array.from(
  new Set([
    ...GLOBAL_SKILL_REFERENTIAL.flatMap((group) => group.items.map(referentialItemName)),
    "Excel",
    "CRM",
    "Salesforce",
    "HubSpot",
    "SQL",
    "Gestion de projet",
    "Agile/Scrum",
    "Prospection",
    "Négociation",
    "Reporting",
    "GPEC",
    "SIRH",
  ]),
).sort((a, b) => a.localeCompare(b, "fr"));

type FormState = {
  title: string;
  city: string;
  contract_type: string;
  salary_range: string;
  remote_policy: string;
  description: string;
  requirements: string;
  benefits: string;
  experience_level: string;
  education_level: string;
  soft_skills: string[];
  hard_skills: string[];
};

const EMPTY: FormState = {
  title: "",
  city: "",
  contract_type: "CDI",
  salary_range: "",
  remote_policy: "Sur site",
  description: "",
  requirements: "",
  benefits: "",
  experience_level: "Non spécifiée",
  education_level: "Non requis",
  soft_skills: [],
  hard_skills: [],
};

function SkillPicker({
  label,
  options,
  selected,
  onToggle,
  customValue,
  onCustomChange,
  onCustomAdd,
  placeholder,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (skill: string) => void;
  customValue: string;
  onCustomChange: (value: string) => void;
  onCustomAdd: () => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options
      .filter((skill) => !q || skill.toLowerCase().includes(q))
      .slice(0, 40);
  }, [options, query]);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => onToggle(skill)}
              className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800"
            >
              {skill}
              <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      ) : null}
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filtrer le catalogue…"
        className="h-9"
      />
      <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-2">
        <div className="flex flex-wrap gap-2">
          {filtered.map((skill) => {
            const active = selected.some((s) => s.toLowerCase() === skill.toLowerCase());
            return (
              <button
                key={skill}
                type="button"
                onClick={() => onToggle(skill)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  active
                    ? "border-violet-500 bg-violet-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-violet-200",
                )}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex gap-2">
        <Input
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCustomAdd();
            }
          }}
        />
        <Button type="button" variant="outline" className="shrink-0" onClick={onCustomAdd}>
          Ajouter
        </Button>
      </div>
    </div>
  );
}

export default function CreateOfferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [customSoft, setCustomSoft] = useState("");
  const [customHard, setCustomHard] = useState("");

  useEffect(() => {
    const metier = (searchParams.get("metier") ?? "").trim();
    const softSkill = (searchParams.get("soft_skill") ?? "").trim();
    const target = (searchParams.get("target") ?? "").trim();
    if (!metier && !softSkill) return;
    setForm((prev) => {
      const soft = softSkill
        ? prev.soft_skills.some((s) => s.toLowerCase() === softSkill.toLowerCase())
          ? prev.soft_skills
          : [...prev.soft_skills, softSkill]
        : prev.soft_skills;
      return {
        ...prev,
        title: prev.title || (metier ? `${metier} — recrutement` : prev.title),
        description:
          prev.description ||
          (metier || softSkill
            ? `Poste lié au besoin compétences${metier ? ` « ${metier} »` : ""}${
                softSkill ? ` — Soft skill prioritaire : ${softSkill}${target ? ` (cible ${target}/15)` : ""}` : ""
              }.`
            : prev.description),
        soft_skills: soft,
      };
    });
  }, [searchParams]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSkill = (key: "soft_skills" | "hard_skills", skill: string) => {
    const normalized = skill.trim();
    if (!normalized) return;
    setForm((prev) => {
      const exists = prev[key].some((s) => s.toLowerCase() === normalized.toLowerCase());
      return {
        ...prev,
        [key]: exists
          ? prev[key].filter((s) => s.toLowerCase() !== normalized.toLowerCase())
          : [...prev[key], normalized],
      };
    });
  };

  const addCustom = (key: "soft_skills" | "hard_skills", value: string, clear: () => void) => {
    const normalized = value.trim();
    if (!normalized) return;
    toggleSkill(key, normalized);
    clear();
  };

  const submit = async (status: "published" | "draft") => {
    if (!form.title.trim()) {
      toast.error("Le titre de l'offre est requis");
      return;
    }
    if (!form.description.trim()) {
      toast.error("La description du poste est requise");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/dashboard/entreprise/job-offers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          city: form.city.trim() || null,
          contract_type: form.contract_type,
          salary_range: form.salary_range.trim() || null,
          remote_policy: form.remote_policy,
          description: form.description.trim(),
          requirements: form.requirements.trim() || null,
          benefits: form.benefits.trim() || null,
          experience_level: form.experience_level,
          education_level: form.education_level,
          soft_skills: form.soft_skills,
          hard_skills: form.hard_skills,
          status,
        }),
      });
      const payload = (await response.json()) as { offer?: { id: string }; error?: string };
      if (!response.ok || !payload.offer?.id) {
        throw new Error(payload.error || "Impossible d'enregistrer l'offre");
      }
      toast.success(status === "published" ? "Offre publiée" : "Brouillon enregistré");
      router.push(`/dashboard/entreprise/offres/${payload.offer.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f7f7f5] text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/dashboard/entreprise/offres"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à mes offres
          </Link>

          <header className="mt-6 mb-8">
            <h1 className={ENTREPRISE_H1_CLASS}>Créer une offre</h1>
            <p className="mt-2 text-center text-sm text-gray-500">
              Renseignez les informations comme sur un job board (Indeed, France Travail, HelloWork).
            </p>
          </header>

          <form
            className="space-y-6 rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              void submit("published");
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-gray-700">Intitulé du poste *</span>
              <Input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Ex. Account Manager B2B"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-700">Lieu</span>
                <Input
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Ex. Le Havre / Remote France"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-700">Type de contrat *</span>
                <select
                  value={form.contract_type}
                  onChange={(e) => update("contract_type", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {CONTRACT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-700">Rémunération</span>
                <Input
                  value={form.salary_range}
                  onChange={(e) => update("salary_range", e.target.value)}
                  placeholder="Ex. 38-45k € / an"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-700">Modalité de travail</span>
                <select
                  value={form.remote_policy}
                  onChange={(e) => update("remote_policy", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option>Sur site</option>
                  <option>Hybride</option>
                  <option>Télétravail complet</option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-700">Expérience souhaitée</span>
                <select
                  value={form.experience_level}
                  onChange={(e) => update("experience_level", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {EXPERIENCE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-700">
                  Niveau de formation <span className="font-normal text-gray-400">(optionnel)</span>
                </span>
                <select
                  value={form.education_level}
                  onChange={(e) => update("education_level", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-gray-700">Description de la fiche de poste *</span>
              <Textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Contexte, missions, responsabilités, environnement de travail…"
                className="min-h-[160px]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-gray-700">Profil recherché</span>
              <Textarea
                value={form.requirements}
                onChange={(e) => update("requirements", e.target.value)}
                placeholder="Complément libre : personnalité, secteur, outils spécifiques…"
                className="min-h-[120px]"
              />
            </label>

            <SkillPicker
              label="Soft skills recherchées"
              options={SOFT_SKILL_OPTIONS}
              selected={form.soft_skills}
              onToggle={(skill) => toggleSkill("soft_skills", skill)}
              customValue={customSoft}
              onCustomChange={setCustomSoft}
              onCustomAdd={() => addCustom("soft_skills", customSoft, () => setCustomSoft(""))}
              placeholder="Ajouter une soft skill absente…"
            />

            <SkillPicker
              label="Hard skills recherchées"
              options={HARD_SKILL_OPTIONS}
              selected={form.hard_skills}
              onToggle={(skill) => toggleSkill("hard_skills", skill)}
              customValue={customHard}
              onCustomChange={setCustomHard}
              onCustomAdd={() => addCustom("hard_skills", customHard, () => setCustomHard(""))}
              placeholder="Ajouter une hard skill absente…"
            />

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-gray-700">Avantages</span>
              <Textarea
                value={form.benefits}
                onChange={(e) => update("benefits", e.target.value)}
                placeholder="Mutuelle, télétravail, tickets restaurant, formation…"
                className="min-h-[96px]"
              />
            </label>

            <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-6">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void submit("draft")}
              >
                Enregistrer en brouillon
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-violet-600 text-white hover:bg-violet-700"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Publier l&apos;offre
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
