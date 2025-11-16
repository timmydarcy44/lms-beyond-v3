"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrganizationWithAdminAction } from "@/app/super/organisations/new/actions";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

type MemberInput = {
  email: string;
  role: "instructor" | "learner" | "tutor";
  fullName: string;
};

export function CreateOrganizationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<MemberInput[]>([]);

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations de base */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-gray-900">
            Nom de l'organisation *
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Beyond Learning"
            required
            className="mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900"
          />
        </div>

        <div>
          <Label htmlFor="slug" className="text-gray-900">
            Slug (optionnel)
          </Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Ex: beyond-learning"
            className="mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">
            Généré automatiquement si vide (basé sur le nom)
          </p>
        </div>

        <div>
          <Label htmlFor="description" className="text-gray-900">
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

      {/* Membres */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-gray-900">Membres de l'organisation</Label>
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
              Aucun membre ajouté. Cliquez sur "Ajouter un membre" pour commencer.
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
                      className="mt-1 border-gray-300 bg-white text-gray-900 text-sm focus:border-gray-900"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700 text-xs">Nom complet *</Label>
                    <Input
                      value={member.fullName}
                      onChange={(e) => handleMemberChange(index, "fullName", e.target.value)}
                      placeholder="Jean Dupont"
                      required
                      className="mt-1 border-gray-300 bg-white text-gray-900 text-sm focus:border-gray-900"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700 text-xs">Rôle *</Label>
                    <select
                      value={member.role}
                      onChange={(e) => handleMemberChange(index, "role", e.target.value as MemberInput["role"])}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
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
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
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
          disabled={isLoading || !name}
          className="bg-black text-white hover:bg-gray-900"
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
