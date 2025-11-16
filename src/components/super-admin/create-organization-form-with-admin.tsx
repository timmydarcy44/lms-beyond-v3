"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrganizationWithAdminAction } from "@/app/super/organisations/new/actions";
import { toast } from "sonner";
import { Loader2, Plus, X, Upload, Building2 } from "lucide-react";
import Image from "next/image";

type AdminInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  logo?: string;
};

type MemberInput = {
  email: string;
  role: "instructor" | "learner" | "tutor";
  fullName: string;
};

export function CreateOrganizationFormWithAdmin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [admin, setAdmin] = useState<AdminInput>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    logo: "",
  });
  const [members, setMembers] = useState<MemberInput[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleAdminChange = (field: keyof AdminInput, value: string) => {
    setAdmin({ ...admin, [field]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Pour l'instant, on stocke juste l'URL (à implémenter upload réel)
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setAdmin({ ...admin, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMember = () => {
    setMembers([...members, { email: "", role: "learner", fullName: "" }]);
  };

  const handleRemoveMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, field: keyof MemberInput, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    setMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await createOrganizationWithAdminAction({
        name,
        slug: slug || undefined,
        description: description || undefined,
        admin: admin.email ? {
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          phone: admin.phone || undefined,
          logo: admin.logo || undefined,
        } : undefined,
        members: members.filter((m) => m.email && m.fullName),
      });

      if (result.success) {
        toast.success("Organisation créée avec succès !");
        router.push(`/super/organisations/${result.organizationId}`);
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Informations de l'organisation */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-gray-900 text-base font-medium">
            Nom de l'organisation *
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Beyond Learning"
            required
            className="mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900 h-11"
          />
        </div>

        <div>
          <Label htmlFor="slug" className="text-gray-900 text-base font-medium">
            Slug (optionnel)
          </Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Ex: beyond-learning"
            className="mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900 h-11"
          />
          <p className="mt-1 text-xs text-gray-500">
            Généré automatiquement si vide (basé sur le nom)
          </p>
        </div>

        <div>
          <Label htmlFor="description" className="text-gray-900 text-base font-medium">
            Description (optionnel)
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description de l'organisation..."
            rows={3}
            className="mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900"
          />
        </div>
      </div>

      {/* Administrateur */}
      <div className="space-y-4 border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-gray-900" />
          <Label className="text-gray-900 text-base font-semibold">
            Administrateur de l'organisation
          </Label>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Créez le compte administrateur principal pour cette organisation. Un email d'invitation lui sera envoyé.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="adminFirstName" className="text-gray-700">
              Prénom *
            </Label>
            <Input
              id="adminFirstName"
              value={admin.firstName}
              onChange={(e) => handleAdminChange("firstName", e.target.value)}
              placeholder="Jean"
              required={!!admin.email}
              className="mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900 h-11"
            />
          </div>

          <div>
            <Label htmlFor="adminLastName" className="text-gray-700">
              Nom *
            </Label>
            <Input
              id="adminLastName"
              value={admin.lastName}
              onChange={(e) => handleAdminChange("lastName", e.target.value)}
              placeholder="Dupont"
              required={!!admin.email}
              className="mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900 h-11"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="adminEmail" className="text-gray-700">
              Email *
            </Label>
            <Input
              id="adminEmail"
              type="email"
              value={admin.email}
              onChange={(e) => handleAdminChange("email", e.target.value)}
              placeholder="admin@exemple.com"
              required={!!admin.firstName || !!admin.lastName}
              className="mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900 h-11"
            />
          </div>

          <div>
            <Label htmlFor="adminPhone" className="text-gray-700">
              Téléphone (optionnel)
            </Label>
            <Input
              id="adminPhone"
              type="tel"
              value={admin.phone}
              onChange={(e) => handleAdminChange("phone", e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className="mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900 h-11"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="adminLogo" className="text-gray-700">
            Logo de l'entreprise (optionnel)
          </Label>
          <div className="mt-2 space-y-3">
            {logoPreview && (
              <div className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden">
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setLogoPreview(null);
                    setAdmin({ ...admin, logo: "" });
                  }}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                id="adminLogo"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50 transition">
                <Upload className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">Télécharger un logo</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Membres additionnels */}
      <div className="space-y-4 border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between">
          <Label className="text-gray-900 text-base font-medium">Autres membres (optionnel)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddMember}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un membre
          </Button>
        </div>

        {members.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-600">
              Aucun membre ajouté. Vous pourrez en ajouter plus tard.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Membre {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(index)}
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-900"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <Label className="text-gray-700 text-xs">Email *</Label>
                    <Input
                      value={member.email}
                      onChange={(e) => handleMemberChange(index, "email", e.target.value)}
                      placeholder="email@exemple.com"
                      type="email"
                      required
                      className="mt-1 border-gray-300 bg-white text-gray-900 text-sm focus:border-gray-900 h-9"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700 text-xs">Nom complet *</Label>
                    <Input
                      value={member.fullName}
                      onChange={(e) => handleMemberChange(index, "fullName", e.target.value)}
                      placeholder="Jean Dupont"
                      required
                      className="mt-1 border-gray-300 bg-white text-gray-900 text-sm focus:border-gray-900 h-9"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700 text-xs">Rôle *</Label>
                    <select
                      value={member.role}
                      onChange={(e) => handleMemberChange(index, "role", e.target.value as MemberInput["role"])}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none h-9"
                    >
                      <option value="instructor">Formateur</option>
                      <option value="learner">Apprenant</option>
                      <option value="tutor">Tuteur</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !name || (admin.email && (!admin.firstName || !admin.lastName))}
          className="bg-black text-white hover:bg-gray-900 h-11 px-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Création...
            </>
          ) : (
            "Créer l'organisation"
          )}
        </Button>
      </div>
    </form>
  );
}



