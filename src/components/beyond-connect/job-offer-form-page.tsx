"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Send, X, Sparkles } from "lucide-react";
import { AIGeneratorModal } from "./ai-generator-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type JobOfferFormPageProps = {
  userId: string;
};

// Soft skills basées sur le système existant
const SOFT_SKILLS = [
  { id: "gestion_emotions_stress", label: "Gestion des émotions & du stress" },
  { id: "communication_influence", label: "Communication & influence" },
  { id: "perseverance_action", label: "Persévérance & passage à l'action" },
  { id: "organisation_priorites", label: "Organisation, temps & priorités" },
  { id: "empathie_ecoute_active", label: "Empathie & écoute active" },
  { id: "resolution_problemes", label: "Résolution de problèmes & pensée critique" },
  { id: "collaboration_conflits", label: "Collaboration & gestion des conflits" },
  { id: "creativite_adaptabilite", label: "Créativité & adaptabilité" },
  { id: "leadership_vision", label: "Leadership & vision" },
  { id: "confiance_decision", label: "Confiance en soi & prise de décision" },
];

const CONTRACT_TYPES = [
  { value: "stage", label: "Stage" },
  { value: "alternance", label: "Alternance" },
  { value: "cdi", label: "CDI" },
  { value: "cdd", label: "CDD" },
  { value: "freelance", label: "Freelance" },
  { value: "interim", label: "Intérim" },
];

export function JobOfferFormPage({ userId }: JobOfferFormPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);

  // Form data
  const [companyId, setCompanyId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [companyPresentation, setCompanyPresentation] = useState<string>("");
  const [contractType, setContractType] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [remoteAllowed, setRemoteAllowed] = useState<boolean>(false);
  const [salaryMin, setSalaryMin] = useState<string>("");
  const [salaryMax, setSalaryMax] = useState<string>("");
  const [hoursPerWeek, setHoursPerWeek] = useState<string>("");
  const [selectedSoftSkills, setSelectedSoftSkills] = useState<string[]>([]);
  const [hardSkills, setHardSkills] = useState<string>("");
  const [requiredExperience, setRequiredExperience] = useState<string>("");
  const [requiredEducation, setRequiredEducation] = useState<string>("");
  const [benefits, setBenefits] = useState<string>("");
  const [applicationDeadline, setApplicationDeadline] = useState<string>("");
  
  // AI Modal states
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiModalType, setAiModalType] = useState<"description" | "company_presentation">("description");

  useEffect(() => {
    loadCompanies();
  }, [userId]);

  const loadCompanies = async () => {
    try {
      const response = await fetch("/api/beyond-connect/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
        if (data.companies && data.companies.length === 1) {
          setCompanyId(data.companies[0].id);
        }
      } else {
        const errorData = await response.json();
        if (errorData.error?.includes("Could not find the table")) {
          toast.error("Les tables Beyond Connect n'ont pas été créées. Veuillez exécuter les scripts SQL dans Supabase Studio.");
        }
      }
    } catch (error) {
      console.error("[job-offer-form] Error loading companies:", error);
      toast.error("Erreur lors du chargement des entreprises. Vérifiez que les tables Beyond Connect existent.");
    }
  };

  const toggleSoftSkill = (skillId: string) => {
    setSelectedSoftSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const handleSave = async (publish: boolean = false) => {
    if (!companyId || !title || !contractType) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    if (!remoteAllowed && !location) {
      toast.error("Le lieu est obligatoire si le télétravail n'est pas autorisé");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        company_id: companyId,
        title,
        description: description || "",
        company_presentation: companyPresentation || "",
        contract_type: contractType,
        location: remoteAllowed ? null : location,
        remote_allowed: remoteAllowed,
        salary_min: salaryMin ? parseFloat(salaryMin) : null,
        salary_max: salaryMax ? parseFloat(salaryMax) : null,
        hours_per_week: hoursPerWeek ? parseInt(hoursPerWeek) : null,
        required_skills: hardSkills
          ? hardSkills.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        required_soft_skills: selectedSoftSkills,
        required_experience: requiredExperience || null,
        required_education: requiredEducation || null,
        benefits: benefits ? benefits.split(",").map((b) => b.trim()).filter(Boolean) : [],
        application_deadline: applicationDeadline || null,
        is_active: publish,
      };

      const response = await fetch("/api/beyond-connect/job-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la sauvegarde");
      }

      const data = await response.json();
      toast.success(publish ? "Offre publiée avec succès" : "Offre sauvegardée en brouillon");
      router.push(`/beyond-connect-app/companies/jobs/${data.jobOffer.id}`);
    } catch (error: any) {
      console.error("[job-offer-form] Error saving job offer:", error);
      toast.error(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/beyond-connect-app/companies">
            <Button variant="ghost" className="text-[#003087] hover:bg-gray-100">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Créer une offre d'emploi</h1>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave(false);
          }}
          className="space-y-6"
        >
          {/* Entreprise */}
          {companies.length > 1 && (
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Entreprise</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={companyId} onValueChange={setCompanyId} required>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Sélectionner une entreprise" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Informations principales */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Informations principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-gray-900 mb-3 block">
                  Intitulé du poste *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Développeur Full Stack"
                  required
                  className="bg-white border-gray-300"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label htmlFor="description" className="text-gray-900">
                    Description de l'annonce
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAiModalType("description");
                      setAiModalOpen(true);
                    }}
                    className="text-[#003087] hover:text-[#002a6b] hover:bg-blue-50"
                  >
                    <Sparkles className="mr-1 h-3 w-3" />
                    Créer la description grâce à l'IA
                  </Button>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez les missions, responsabilités, objectifs du poste..."
                  rows={6}
                  className="bg-white border-gray-300"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Présentez les missions principales, les responsabilités et les objectifs du poste
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="contract_type" className="text-gray-900 mb-3 block">
                    Type de contrat *
                  </Label>
                  <Select value={contractType} onValueChange={setContractType} required>
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="hours_per_week" className="text-gray-900 mb-3 block">
                    Nombre d'heures par semaine
                  </Label>
                  <Input
                    id="hours_per_week"
                    type="number"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(e.target.value)}
                    placeholder="Ex: 35"
                    min="1"
                    max="60"
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Présentation de l'entreprise */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-900">Présentation de l'entreprise</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAiModalType("company_presentation");
                    setAiModalOpen(true);
                  }}
                  className="text-[#003087] hover:text-[#002a6b] hover:bg-blue-50"
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  Créer une présentation grâce à Beyond AI
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="company_presentation" className="text-gray-900 mb-3 block">
                  Présentation de l'entreprise
                </Label>
                <Textarea
                  id="company_presentation"
                  value={companyPresentation}
                  onChange={(e) => setCompanyPresentation(e.target.value)}
                  placeholder="Présentez votre entreprise : secteur d'activité, valeurs, culture, taille, localisation..."
                  rows={6}
                  className="bg-white border-gray-300"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Décrivez votre entreprise pour donner envie aux candidats de vous rejoindre
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Localisation */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Localisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remote_allowed"
                  checked={remoteAllowed}
                  onCheckedChange={(checked) => setRemoteAllowed(checked as boolean)}
                />
                <Label htmlFor="remote_allowed" className="text-gray-900 cursor-pointer">
                  Télétravail autorisé
                </Label>
              </div>

              {!remoteAllowed && (
                <div>
                  <Label htmlFor="location" className="text-gray-900 mb-3 block">
                    Lieu *
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Paris, Lyon, Remote..."
                    required={!remoteAllowed}
                    className="bg-white border-gray-300"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rémunération */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Rémunération</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="salary_min" className="text-gray-900 mb-3 block">
                    Salaire minimum (€)
                  </Label>
                  <Input
                    id="salary_min"
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    placeholder="Ex: 30000"
                    min="0"
                    className="bg-white border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="salary_max" className="text-gray-900 mb-3 block">
                    Salaire maximum (€)
                  </Label>
                  <Input
                    id="salary_max"
                    type="number"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    placeholder="Ex: 45000"
                    min="0"
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Savoir-être (Soft Skills) */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Savoir-être (Soft Skills)</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Sélectionnez les compétences comportementales recherchées</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SOFT_SKILLS.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant={selectedSoftSkills.includes(skill.id) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      selectedSoftSkills.includes(skill.id)
                        ? "bg-[#003087] text-white border-[#003087]"
                        : "border-gray-300 text-gray-700 hover:border-[#003087] hover:text-[#003087]"
                    }`}
                    onClick={() => toggleSoftSkill(skill.id)}
                  >
                    {skill.label}
                  </Badge>
                ))}
              </div>
              {selectedSoftSkills.length > 0 && (
                <p className="mt-3 text-sm text-gray-600">
                  {selectedSoftSkills.length} compétence{selectedSoftSkills.length > 1 ? "s" : ""} sélectionnée{selectedSoftSkills.length > 1 ? "s" : ""}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Savoir-faire (Hard Skills) */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Savoir-faire (Compétences techniques)</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="hard_skills" className="text-gray-900 mb-3 block">
                  Compétences requises
                </Label>
                <Input
                  id="hard_skills"
                  value={hardSkills}
                  onChange={(e) => setHardSkills(e.target.value)}
                  placeholder="Ex: JavaScript, Python, React, SQL (séparées par des virgules)"
                  className="bg-white border-gray-300"
                />
                <p className="mt-1 text-xs text-gray-500">Séparez les compétences par des virgules</p>
              </div>
            </CardContent>
          </Card>

          {/* Expérience et formation */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Expérience et formation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="required_experience" className="text-gray-900 mb-3 block">
                    Niveau d'expérience
                  </Label>
                  <Select 
                    value={requiredExperience || undefined} 
                    onValueChange={(value) => setRequiredExperience(value === "none" ? "" : value)}
                  >
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue placeholder="Non spécifié" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non spécifié</SelectItem>
                      <SelectItem value="junior">Junior (0-2 ans)</SelectItem>
                      <SelectItem value="mid">Intermédiaire (2-5 ans)</SelectItem>
                      <SelectItem value="senior">Senior (5+ ans)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="required_education" className="text-gray-900 mb-3 block">
                    Niveau de formation
                  </Label>
                  <Select 
                    value={requiredEducation || undefined} 
                    onValueChange={(value) => setRequiredEducation(value === "none" ? "" : value)}
                  >
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue placeholder="Non spécifié" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Non spécifié</SelectItem>
                      <SelectItem value="bac">Bac</SelectItem>
                      <SelectItem value="bac+2">Bac+2 (BTS, DUT)</SelectItem>
                      <SelectItem value="bac+3">Bac+3 (Licence)</SelectItem>
                      <SelectItem value="bac+5">Bac+5 (Master)</SelectItem>
                      <SelectItem value="doctorat">Doctorat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avantages et date limite */}
          <Card className="border-gray-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Informations complémentaires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="benefits" className="text-gray-900 mb-3 block">
                  Avantages
                </Label>
                <Input
                  id="benefits"
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  placeholder="Ex: Tickets restaurant, Mutuelle, Télétravail (séparés par des virgules)"
                  className="bg-white border-gray-300"
                />
                <p className="mt-1 text-xs text-gray-500">Séparez les avantages par des virgules</p>
              </div>

              <div>
                <Label htmlFor="application_deadline" className="text-gray-900 mb-3 block">
                  Date limite de candidature
                </Label>
                <Input
                  id="application_deadline"
                  type="date"
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                  className="bg-white border-gray-300"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pb-8">
            <Link href="/beyond-connect-app/companies">
              <Button type="button" variant="outline" className="border-gray-300 text-gray-700">
                Annuler
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={loading}
              className="border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder en brouillon
            </Button>
            <Button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                handleSave(true);
              }}
              disabled={loading}
              className="bg-[#003087] hover:bg-[#002a6b] text-white"
            >
              <Send className="mr-2 h-4 w-4" />
              {loading ? "Publication..." : "Publier l'offre"}
            </Button>
          </div>
        </form>

        {/* AI Generator Modal */}
        <AIGeneratorModal
          open={aiModalOpen}
          onOpenChange={setAiModalOpen}
          type={aiModalType}
          metadata={{
            title,
            contract_type: contractType,
            location: remoteAllowed ? "Télétravail" : location,
            hours_per_week: hoursPerWeek,
            salary_min: salaryMin,
            salary_max: salaryMax,
            required_skills: hardSkills ? hardSkills.split(",").map((s) => s.trim()).filter(Boolean) : [],
            required_soft_skills: selectedSoftSkills,
            required_experience: requiredExperience,
            required_education: requiredEducation,
            benefits: benefits ? benefits.split(",").map((b) => b.trim()).filter(Boolean) : [],
            remote_allowed: remoteAllowed,
            company_name: companies.find((c) => c.id === companyId)?.name,
          }}
          onGenerated={(text) => {
            if (aiModalType === "description") {
              setDescription(text);
            } else {
              setCompanyPresentation(text);
            }
          }}
        />
      </div>
    </div>
  );
}

