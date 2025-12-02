"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { User, GraduationCap, Heart, Briefcase, ArrowRight, Check, Camera, Plus, X, FileText, MapPin, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import { motion } from "framer-motion";
import { ExperienceForm } from "./experience-form";
import { EducationForm } from "./education-form";
import { calculateProfileScore, ProfileScoreData } from "@/lib/beyond-connect/profile-score";
import { Progress } from "@/components/ui/progress";
import { env } from "@/lib/env";

// Fonction pour construire l'URL Supabase Storage
function getSupabaseStorageUrl(bucket: string, path: string): string {
  const supabaseUrl = 
    env.supabaseUrl || 
    (typeof window !== 'undefined' ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL : undefined) ||
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined);
  
  if (!supabaseUrl) {
    return "";
  }
  
  const encodedBucket = encodeURIComponent(bucket);
  const pathParts = path.split('/');
  const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/');
  
  return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

const BUCKET_NAME = "Public";

// Images pour la colonne de droite - une image par étape
const ONBOARDING_IMAGES_BY_STEP: Record<number, { path: string; alt: string }> = {
  1: { path: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80", alt: "Personnes collaborant" },
  2: { path: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80", alt: "Étudiant en cours" },
  3: { path: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80", alt: "Professionnel au travail" },
  4: { path: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80", alt: "Formation et développement" },
  5: { path: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80", alt: "Équipe professionnelle" },
  6: { path: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80", alt: "Succès professionnel" },
};

type CandidateOnboardingPageProps = {
  userId: string;
};

type ProfileData = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  avatar_url?: string;
  bio?: string;
  passions?: string;
  current_studies?: string;
  education_level?: string;
  city?: string;
  cv_url?: string;
  cv_file_name?: string;
  employment_type?: string; // CDD, CDI, Freelance, Alternance, Stage, etc.
};

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

export function CandidateOnboardingPage({ userId }: CandidateOnboardingPageProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [profileScore, setProfileScore] = useState<{ score: number; maxScore: number; details: any[] } | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    birth_date: "",
    avatar_url: "",
    bio: "",
    passions: "",
    current_studies: "",
    education_level: "",
    city: "",
    cv_url: "",
    cv_file_name: "",
    employment_type: "",
  });
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);

  useEffect(() => {
    loadExistingProfile();
  }, [userId]);

  const loadExistingProfile = async () => {
    try {
      const [profileRes, experiencesRes, educationRes] = await Promise.all([
        fetch(`/api/beyond-connect/profile`),
        fetch(`/api/beyond-connect/experiences`),
        fetch(`/api/beyond-connect/education`),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        if (data.profile) {
          const newProfileData = {
            first_name: data.profile.first_name || "",
            last_name: data.profile.last_name || "",
            email: data.profile.email || "",
            phone: data.profile.phone || "",
            birth_date: data.profile.birth_date || "",
            avatar_url: data.profile.avatar_url || "",
            bio: data.profile.bio || "",
            passions: data.profile.passions || "",
            current_studies: data.profile.current_studies || "",
            education_level: data.profile.education_level || "",
            city: data.profile.city || "",
            cv_url: data.profile.cv_url || "",
            cv_file_name: data.profile.cv_file_name || "",
            employment_type: data.profile.employment_type || "",
          };
          setProfileData(newProfileData);
        }
      }

      if (experiencesRes.ok) {
        const expData = await experiencesRes.json();
        setExperiences(expData.experiences || []);
      }

      if (educationRes.ok) {
        const eduData = await educationRes.json();
        setEducation(eduData.education || []);
      }
    } catch (error) {
      console.error("[onboarding] Error loading profile:", error);
    }
  };

  const updateProfileScore = useCallback(() => {
    const scoreData: ProfileScoreData = {
      hasPhoto: !!profileData.avatar_url,
      hasFirstName: !!profileData.first_name,
      hasLastName: !!profileData.last_name,
      hasEmail: !!profileData.email,
      hasPhone: !!profileData.phone,
      hasCity: !!profileData.city,
      hasBio: !!profileData.bio && profileData.bio.length > 0,
      hasCV: !!profileData.cv_url,
      experiencesCount: experiences.length,
      educationCount: education.length,
      hasEmploymentType: !!profileData.employment_type,
    };
    const score = calculateProfileScore(scoreData);
    setProfileScore(score);
  }, [profileData, experiences, education]);

  // Calculer le score après le chargement des données
  useEffect(() => {
    updateProfileScore();
  }, [updateProfileScore]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image doit faire moins de 5 Mo");
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload");
      }

      const data = await response.json();
      setProfileData({ ...profileData, avatar_url: data.url });
      toast.success("Photo uploadée avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'upload de la photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le CV doit faire moins de 10 Mo");
      return;
    }

    setUploadingCV(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/beyond-connect/upload-cv", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de l'upload");
      }

      const data = await response.json();
      setProfileData({ ...profileData, cv_url: data.url, cv_file_name: data.fileName });
      toast.success("CV uploadé avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'upload du CV");
    } finally {
      setUploadingCV(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!profileData.first_name || !profileData.last_name) {
        toast.error("Veuillez remplir votre nom et prénom");
        return;
      }
    }
    if (step === 2) {
      // Pas de validation obligatoire pour les études
    }
    if (step === 3) {
      // Pas de validation obligatoire pour les expériences
    }
    if (step === 4) {
      // Pas de validation obligatoire pour les diplômes
    }
    if (step === 5) {
      if (!profileData.employment_type) {
        toast.error("Veuillez sélectionner un type d'emploi recherché");
        return;
      }
    }
    if (step === 6) {
      // Dernière étape, pas de validation supplémentaire
    }
    setStep(step + 1);
  };

  const handleAddExperience = () => {
    setEditingExperience(null);
    setShowExperienceForm(true);
  };

  const handleEditExperience = (exp: Experience) => {
    setEditingExperience(exp);
    setShowExperienceForm(true);
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      const response = await fetch(`/api/beyond-connect/experiences/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setExperiences(experiences.filter((e) => e.id !== id));
        toast.success("Expérience supprimée");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleExperienceSaved = () => {
    setShowExperienceForm(false);
    setEditingExperience(null);
    loadExistingProfile();
  };

  const handleAddEducation = () => {
    setEditingEducation(null);
    setShowEducationForm(true);
  };

  const handleEditEducation = (edu: Education) => {
    setEditingEducation(edu);
    setShowEducationForm(true);
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      const response = await fetch(`/api/beyond-connect/education/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setEducation(education.filter((e) => e.id !== id));
        toast.success("Formation supprimée");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleEducationSaved = () => {
    setShowEducationForm(false);
    setEditingEducation(null);
    loadExistingProfile();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Nettoyer les données : ne pas envoyer les champs vides
      const cleanedData = { ...profileData };
      if (!cleanedData.birth_date || cleanedData.birth_date === "") {
        delete cleanedData.birth_date;
      }
      if (!cleanedData.bio || cleanedData.bio.trim() === "") {
        delete cleanedData.bio;
      }
      if (!cleanedData.passions || cleanedData.passions.trim() === "") {
        delete cleanedData.passions;
      }
      if (!cleanedData.current_studies || cleanedData.current_studies.trim() === "") {
        delete cleanedData.current_studies;
      }
      if (!cleanedData.education_level || cleanedData.education_level.trim() === "") {
        delete cleanedData.education_level;
      }

      const response = await fetch(`/api/beyond-connect/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors de la sauvegarde");
      }

      toast.success("Profil créé avec succès !");
      router.push("/beyond-connect-app/welcome");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const currentImage = ONBOARDING_IMAGES_BY_STEP[step] || ONBOARDING_IMAGES_BY_STEP[1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Colonne gauche : Formulaire */}
        <div className="flex flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-6 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Créer mon profil</h1>
            <span className="text-sm text-gray-600">Étape {step} sur 6</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full ${
                  s <= step ? "bg-[#003087]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Informations personnelles */}
        {step === 1 && (
          <Card className="border-gray-200 bg-white shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#003087] text-white">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-900">Informations personnelles</CardTitle>
                  <p className="text-sm text-gray-600">Commençons par les bases</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photo */}
              <div className="flex flex-col items-center">
                <Label className="mb-2 text-base font-semibold text-gray-900">Photo de profil</Label>
                <div className="relative">
                  {profileData.avatar_url ? (
                    <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-[#003087]">
                      <Image
                        src={profileData.avatar_url}
                        alt="Photo de profil"
                        fill
                        className="object-cover"
                      />
                      <button
                        onClick={() => setProfileData({ ...profileData, avatar_url: "" })}
                        className="absolute right-0 top-0 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-full border-4 border-dashed border-gray-300 bg-gray-50 hover:border-[#003087]">
                      <Camera className="h-8 w-8 text-gray-400" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                    </label>
                  )}
                </div>
                {uploadingPhoto && (
                  <p className="mt-2 text-sm text-gray-500">Upload en cours...</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="first_name" className="text-base font-semibold text-gray-900 mb-2 block">Prénom *</Label>
                  <Input
                    id="first_name"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    placeholder="Votre prénom"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-base font-semibold text-gray-900 mb-2 block">Nom *</Label>
                  <Input
                    id="last_name"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                    placeholder="Votre nom"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-base font-semibold text-gray-900 mb-2 block">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="mt-1 bg-gray-100"
                />
                <p className="mt-1 text-xs text-gray-500">L'email ne peut pas être modifié</p>
              </div>

              <div>
                <Label htmlFor="phone" className="text-base font-semibold text-gray-900 mb-2 block">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="city" className="text-base font-semibold text-gray-900 mb-2 block">Ville de résidence</Label>
                <Input
                  id="city"
                  type="text"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  placeholder="Ex: Paris, Lyon, Marseille..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="birth_date" className="text-base font-semibold text-gray-900 mb-2 block">Date de naissance</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={profileData.birth_date}
                  onChange={(e) => setProfileData({ ...profileData, birth_date: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Upload CV */}
              <div className="col-span-2">
                <Label htmlFor="cv" className="text-base font-semibold text-gray-900 mb-2 block">CV (optionnel)</Label>
                {profileData.cv_url ? (
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#003087]" />
                      <div>
                        <p className="font-medium text-gray-900">{profileData.cv_file_name || "CV uploadé"}</p>
                        <a
                          href={profileData.cv_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#003087] hover:underline"
                        >
                          Voir le CV
                        </a>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setProfileData({ ...profileData, cv_url: "", cv_file_name: "" })}
                      className="text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:border-[#003087]">
                    <div className="text-center">
                      <FileText className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">
                        {uploadingCV ? "Upload en cours..." : "Cliquez pour uploader votre CV"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">PDF, DOC, DOCX (max 10 Mo)</p>
                      <input
                        id="cv"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleCVUpload}
                        className="hidden"
                        disabled={uploadingCV}
                      />
                    </div>
                  </label>
                )}
              </div>

              <div>
                <Label htmlFor="bio" className="text-base font-semibold text-gray-900 mb-2 block">Présentation</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Parlez-nous de vous en quelques mots..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext} className="bg-[#003087] hover:bg-[#002a6b] text-white">
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Études */}
        {step === 2 && (
          <Card className="border-gray-200 bg-white shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#003087] text-white">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-900">Vos études</CardTitle>
                  <p className="text-sm text-gray-600">Parlez-nous de votre parcours</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="current_studies" className="text-base font-semibold text-gray-900 mb-2 block">Études actuelles *</Label>
                <Input
                  id="current_studies"
                  value={profileData.current_studies}
                  onChange={(e) => setProfileData({ ...profileData, current_studies: e.target.value })}
                  placeholder="Ex: Master en Marketing Digital, BTS Commerce..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="education_level" className="text-base font-semibold text-gray-900 mb-2 block">Niveau d'études</Label>
                <select
                  id="education_level"
                  value={profileData.education_level}
                  onChange={(e) => setProfileData({ ...profileData, education_level: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2"
                >
                  <option value="">Sélectionnez un niveau</option>
                  <option value="bac">Bac</option>
                  <option value="bac+2">Bac+2 (BTS, DUT...)</option>
                  <option value="bac+3">Bac+3 (Licence, Bachelor...)</option>
                  <option value="bac+5">Bac+5 (Master, École...)</option>
                  <option value="bac+8">Bac+8 (Doctorat...)</option>
                </select>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Précédent
                </Button>
                <Button onClick={handleNext} className="bg-[#003087] hover:bg-[#002a6b] text-white">
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Expériences */}
        {step === 3 && (
          <Card className="border-gray-200 bg-white shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#003087] text-white">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-gray-900">Vos expériences</CardTitle>
                    <p className="text-sm text-gray-600">Ajoutez vos expériences professionnelles</p>
                  </div>
                </div>
                <Button
                  onClick={handleAddExperience}
                  size="sm"
                  className="bg-[#003087] hover:bg-[#002a6b] text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {showExperienceForm ? (
                <ExperienceForm
                  experience={editingExperience || undefined}
                  onSave={handleExperienceSaved}
                  onCancel={() => {
                    setShowExperienceForm(false);
                    setEditingExperience(null);
                  }}
                />
              ) : (
                <>
                  {experiences.length === 0 ? (
                    <p className="py-8 text-center text-gray-500">
                      Aucune expérience ajoutée. Cliquez sur "Ajouter" pour en ajouter une.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {experiences.map((exp) => (
                        <div
                          key={exp.id}
                          className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                            <p className="text-gray-700">{exp.company}</p>
                            {exp.location && <p className="text-sm text-gray-600">{exp.location}</p>}
                            <p className="mt-1 text-sm text-gray-600">
                              {new Date(exp.start_date).toLocaleDateString("fr-FR")} -{" "}
                              {exp.is_current
                                ? "Aujourd'hui"
                                : exp.end_date
                                ? new Date(exp.end_date).toLocaleDateString("fr-FR")
                                : ""}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditExperience(exp)}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExperience(exp.id!)}
                              className="text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(step - 1)}>
                      Précédent
                    </Button>
                    <Button onClick={handleNext} className="bg-[#003087] hover:bg-[#002a6b] text-white">
                      Suivant
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Diplômes */}
        {step === 4 && (
          <Card className="border-gray-200 bg-white shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#003087] text-white">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-gray-900">Vos diplômes</CardTitle>
                    <p className="text-sm text-gray-600">Ajoutez vos formations et diplômes</p>
                  </div>
                </div>
                <Button
                  onClick={handleAddEducation}
                  size="sm"
                  className="bg-[#003087] hover:bg-[#002a6b] text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {showEducationForm ? (
                <EducationForm
                  education={editingEducation || undefined}
                  onSave={handleEducationSaved}
                  onCancel={() => {
                    setShowEducationForm(false);
                    setEditingEducation(null);
                  }}
                />
              ) : (
                <>
                  {education.length === 0 ? (
                    <p className="py-8 text-center text-gray-500">
                      Aucun diplôme ajouté. Cliquez sur "Ajouter" pour en ajouter un.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {education.map((edu) => (
                        <div
                          key={edu.id}
                          className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-4"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                            <p className="text-gray-700">{edu.institution}</p>
                            {edu.field_of_study && (
                              <p className="text-sm text-gray-600">{edu.field_of_study}</p>
                            )}
                            {edu.grade && <p className="text-sm text-gray-600">Note: {edu.grade}</p>}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEducation(edu)}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEducation(edu.id!)}
                              className="text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setStep(step - 1)}>
                      Précédent
                    </Button>
                    <Button onClick={handleNext} className="bg-[#003087] hover:bg-[#002a6b] text-white">
                      Suivant
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 5: Style d'emploi */}
        {step === 5 && (
          <Card className="border-gray-200 bg-white shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#003087] text-white">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-900">Type d'emploi recherché</CardTitle>
                  <p className="text-sm text-gray-600">Quel type de contrat vous intéresse ?</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="employment_type" className="text-base font-semibold text-gray-900 mb-2 block">Style d'emploi *</Label>
                <select
                  id="employment_type"
                  value={profileData.employment_type}
                  onChange={(e) => setProfileData({ ...profileData, employment_type: e.target.value })}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2"
                >
                  <option value="">Sélectionnez un type d'emploi</option>
                  <option value="CDI">CDI (Contrat à Durée Indéterminée)</option>
                  <option value="CDD">CDD (Contrat à Durée Déterminée)</option>
                  <option value="Freelance">Freelance / Indépendant</option>
                  <option value="Alternance">Alternance</option>
                  <option value="Stage">Stage</option>
                  <option value="Interim">Intérim</option>
                  <option value="Temps_partiel">Temps partiel</option>
                  <option value="Temps_plein">Temps plein</option>
                </select>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Précédent
                </Button>
                <Button onClick={handleNext} className="bg-[#003087] hover:bg-[#002a6b] text-white">
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Passions et centres d'intérêt + Jauge de qualification */}
        {step === 6 && (
          <Card className="border-gray-200 bg-white shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#003087] text-white">
                  <Heart className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-900">Passions et centres d'intérêt</CardTitle>
                  <p className="text-sm text-gray-600">Qu'est-ce qui vous anime ?</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="passions" className="text-base font-semibold text-gray-900 mb-2 block">Vos passions</Label>
                <Textarea
                  id="passions"
                  value={profileData.passions}
                  onChange={(e) => setProfileData({ ...profileData, passions: e.target.value })}
                  placeholder="Ex: Sport, musique, lecture, voyage, technologie..."
                  rows={4}
                  className="mt-1"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Décrivez ce qui vous passionne, vos hobbies, vos centres d'intérêt...
                </p>
              </div>

              {/* Jauge de qualification */}
              {profileScore && (
                <div className="rounded-lg border-2 border-[#003087] bg-blue-50 p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#003087]" />
                      <h3 className="text-lg font-semibold text-gray-900">Niveau de qualification de votre profil</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#003087]">{profileScore.score}%</p>
                      <p className="text-xs text-gray-600">sur {profileScore.maxScore} points</p>
                    </div>
                  </div>
                  <Progress 
                    value={profileScore.score} 
                    className="mb-4 h-3 bg-gray-200" 
                    indicatorClassName="bg-[#003087]"
                  />
                  <div className="space-y-2">
                    {profileScore.details.map((detail, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className={detail.missing ? "text-gray-500" : "text-gray-900"}>
                          {detail.missing ? "❌" : "✅"} {detail.label}
                        </span>
                        <span className={detail.missing ? "text-gray-500" : "text-[#003087] font-medium"}>
                          {detail.points}/{detail.maxPoints} pts
                        </span>
                      </div>
                    ))}
                  </div>
                  {profileScore.score < 50 && (
                    <p className="mt-4 text-sm text-amber-600">
                      💡 Complétez votre profil pour améliorer votre visibilité auprès des recruteurs !
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="mt-0.5 h-5 w-5 text-[#003087]" />
                  <div>
                    <p className="font-semibold text-gray-900">Prochaine étape</p>
                    <p className="text-sm text-gray-600">
                      Une fois votre profil créé, vous pourrez ajouter vos expériences, compétences et commencer à candidater !
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Précédent
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-[#003087] hover:bg-[#002a6b] text-white"
                >
                  {loading ? "Enregistrement..." : "Créer mon profil"}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
          </div>
        </div>

        {/* Colonne droite : Image correspondant à l'étape */}
        <div className="hidden lg:block relative overflow-hidden bg-gradient-to-br from-[#003087] to-[#002a6b]">
          <motion.div
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <Image
              src={currentImage.path}
              alt={currentImage.alt}
              fill
              className="object-cover"
              priority={step === 1}
              sizes="50vw"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('unsplash.com')) {
                  target.src = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80";
                }
              }}
            />
            {/* Overlay avec gradient pour améliorer la lisibilité */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

