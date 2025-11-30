"use client";

import { useState, useEffect } from "react";
import { User, Camera, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";

type CandidateProfileEditPageProps = {
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

export function CandidateProfileEditPage({ userId }: CandidateProfileEditPageProps) {
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

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/beyond-connect/profile`);
      if (response.ok) {
        const data = await response.json();
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
    } catch (error) {
      console.error("[profile] Error loading profile:", error);
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

      toast.success("Profil mis à jour avec succès !");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Mon profil</h1>
          <p className="text-lg text-gray-600">Gérez vos informations personnelles</p>
        </div>

        <Card className="border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-900">Informations personnelles</CardTitle>
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

            <div>
              <Label htmlFor="current_studies">Études actuelles</Label>
              <Input
                id="current_studies"
                value={profileData.current_studies}
                onChange={(e) => setProfileData({ ...profileData, current_studies: e.target.value })}
                placeholder="Ex: Master en Marketing Digital"
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

            <div>
              <Label htmlFor="passions">Passions et centres d'intérêt</Label>
              <Textarea
                id="passions"
                value={profileData.passions}
                onChange={(e) => setProfileData({ ...profileData, passions: e.target.value })}
                placeholder="Ex: Sport, musique, lecture, voyage, technologie..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="bg-[#003087] hover:bg-[#002a6b] text-white"
              >
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

