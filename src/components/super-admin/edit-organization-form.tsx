"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { updateOrganizationAction, removeMemberAction } from "@/app/super/organisations/[orgId]/edit/actions";
import { toast } from "sonner";
import { Loader2, Upload, X, Trash2, UserPlus, Shield, GraduationCap, Users } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OrganizationFullDetails = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo: string | null;
  members: Array<{
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    phone: string | null;
  }>;
};

type EditOrganizationFormProps = {
  organization: OrganizationFullDetails;
};

export function EditOrganizationForm({ organization }: EditOrganizationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(organization.name);
  const [slug, setSlug] = useState(organization.slug || "");
  const [description, setDescription] = useState(organization.description || "");
  const [logoPreview, setLogoPreview] = useState<string | null>(organization.logo);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setLogoFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setLogoFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Convertir le logo en base64 si un nouveau fichier a été sélectionné
      let logoBase64: string | undefined = undefined;
      if (logoFile) {
        logoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(logoFile);
        });
      } else if (logoPreview === null && organization.logo) {
        // Si on a supprimé le logo
        logoBase64 = "";
      }

      const result = await updateOrganizationAction({
        organizationId: organization.id,
        name,
        slug: slug || undefined,
        description: description || undefined,
        logo: logoBase64,
      });

      if (result.success) {
        toast.success("Organisation mise à jour avec succès !");
        router.refresh();
        router.push(`/super/organisations/${organization.id}`);
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setIsLoading(true);
    try {
      const result = await removeMemberAction({
        organizationId: organization.id,
        userId: memberToRemove.id,
      });

      if (result.success) {
        toast.success("Membre retiré avec succès");
        router.refresh();
        setMemberToRemove(null);
      } else {
        toast.error(result.error || "Erreur lors du retrait du membre");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const admins = organization.members.filter((m) => m.role === "admin");
  const instructors = organization.members.filter((m) => m.role === "instructor");
  const learners = organization.members.filter((m) => m.role === "learner");
  const tutors = organization.members.filter((m) => m.role === "tutor");

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Informations de base */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Informations Générales</CardTitle>
            <CardDescription className="text-gray-600">
              Modifiez le nom, le slug et la description de l'organisation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                Slug
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
                Description
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
          </CardContent>
        </Card>

        {/* Logo */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Logo de l'Organisation</CardTitle>
            <CardDescription className="text-gray-600">
              Téléchargez ou modifiez le logo de l'organisation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logoPreview && (
              <div className="relative w-48 h-48 border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  fill
                  className="object-contain p-4"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                id="logo"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50 transition">
                <Upload className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  {logoPreview ? "Remplacer le logo" : "Télécharger un logo"}
                </span>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Membres */}
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-semibold text-gray-900">Membres de l'Organisation</CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Gérez les membres de l'organisation. Cliquez sur supprimer pour retirer un membre.
                </CardDescription>
              </div>
              <Link href={`/super/organisations/${organization.id}/add-member`}>
                <Button type="button" className="bg-black text-white hover:bg-gray-900">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter un membre
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Administrateurs */}
            {admins.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-gray-700" />
                  <h3 className="font-semibold text-gray-900">Administrateurs ({admins.length})</h3>
                </div>
                <div className="space-y-2">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{admin.fullName || admin.email}</p>
                        <p className="text-sm text-gray-600">{admin.email}</p>
                        {admin.phone && <p className="text-xs text-gray-500">{admin.phone}</p>}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToRemove({ id: admin.id, name: admin.fullName || admin.email })}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Retirer
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formateurs */}
            {instructors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Formateurs ({instructors.length})</h3>
                </div>
                <div className="space-y-2">
                  {instructors.map((instructor) => (
                    <div
                      key={instructor.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{instructor.fullName || instructor.email}</p>
                        <p className="text-sm text-gray-600">{instructor.email}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToRemove({ id: instructor.id, name: instructor.fullName || instructor.email })}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Retirer
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Apprenants */}
            {learners.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Apprenants ({learners.length})</h3>
                </div>
                <div className="space-y-2">
                  {learners.map((learner) => (
                    <div
                      key={learner.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{learner.fullName || learner.email}</p>
                        <p className="text-sm text-gray-600">{learner.email}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToRemove({ id: learner.id, name: learner.fullName || learner.email })}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Retirer
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tuteurs */}
            {tutors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Tuteurs ({tutors.length})</h3>
                </div>
                <div className="space-y-2">
                  {tutors.map((tutor) => (
                    <div
                      key={tutor.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{tutor.fullName || tutor.email}</p>
                        <p className="text-sm text-gray-600">{tutor.email}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToRemove({ id: tutor.id, name: tutor.fullName || tutor.email })}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Retirer
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          <Link href={`/super/organisations/${organization.id}`}>
            <Button
              type="button"
              variant="ghost"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isLoading || !name}
            className="bg-black text-white hover:bg-gray-900 h-11 px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer les modifications"
            )}
          </Button>
        </div>
      </form>

      {/* Dialog de confirmation pour retirer un membre */}
      <Dialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer le membre</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir retirer <strong>{memberToRemove?.name}</strong> de cette organisation ? Cette action peut être annulée plus tard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMemberToRemove(null)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleRemoveMember}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Retirer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

