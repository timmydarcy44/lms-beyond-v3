"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, GraduationCap, Heart, Briefcase, ArrowRight, Check, Camera, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import { ExperienceForm } from "./experience-form";
import { EducationForm } from "./education-form";

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
          setProfileData({
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
          });
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
      const response = await fetch(`/api/beyond-connect/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      toast.success("Profil créé avec succès !");
      router.push("/beyond-connect-app/profile");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Créer mon profil</h1>
            <span className="text-sm text-gray-600">Étape {step} sur 5</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
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
                <Label className="mb-2">Photo de profil</Label>
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
                  <Label htmlFor="first_name">Prénom *</Label>
                  <Input
                    id="first_name"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    placeholder="Votre prénom"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Nom *</Label>
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
                <Label htmlFor="email">Adresse email</Label>
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
                <Label htmlFor="phone">Téléphone</Label>
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
                <Label htmlFor="birth_date">Date de naissance</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={profileData.birth_date}
                  onChange={(e) => setProfileData({ ...profileData, birth_date: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bio">Présentation</Label>
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
                <Label htmlFor="current_studies">Études actuelles *</Label>
                <Input
                  id="current_studies"
                  value={profileData.current_studies}
                  onChange={(e) => setProfileData({ ...profileData, current_studies: e.target.value })}
                  placeholder="Ex: Master en Marketing Digital, BTS Commerce..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="education_level">Niveau d'études</Label>
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

        {/* Step 5: Passions et centres d'intérêt */}
        {step === 5 && (
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
                <Label htmlFor="passions">Vos passions</Label>
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
  );
}

