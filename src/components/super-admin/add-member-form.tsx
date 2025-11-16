"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { addMemberToOrganizationAction } from "@/app/super/organisations/[orgId]/add-member/actions";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

type AddMemberFormProps = {
  organizationId: string;
  organizationName: string;
};

export function AddMemberForm({ organizationId, organizationName }: AddMemberFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "instructor" | "learner" | "tutor">("learner");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await addMemberToOrganizationAction({
        organizationId,
        email,
        fullName,
        role,
      });

      if (result.success) {
        toast.success("Membre ajouté avec succès !");
        router.refresh();
        router.push(`/super/organisations/${organizationId}/edit`);
      } else {
        toast.error(result.error || "Erreur lors de l'ajout du membre");
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">Nouveau Membre</CardTitle>
        <CardDescription className="text-gray-600">
          Ajoutez un membre existant ou créez un nouvel utilisateur pour cette organisation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-900 text-base font-medium">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemple.com"
                required
                className="mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900 h-11"
              />
              <p className="mt-1 text-xs text-gray-500">
                Si l'utilisateur existe déjà, il sera ajouté à l'organisation. Sinon, un compte sera créé.
              </p>
            </div>

            <div>
              <Label htmlFor="fullName" className="text-gray-900 text-base font-medium">
                Nom complet *
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Dupont"
                required
                className="mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900 h-11"
              />
            </div>

            <div>
              <Label htmlFor="role" className="text-gray-900 text-base font-medium">
                Rôle *
              </Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-gray-900 focus:outline-none h-11"
              >
                <option value="admin">Administrateur</option>
                <option value="instructor">Formateur</option>
                <option value="learner">Apprenant</option>
                <option value="tutor">Tuteur</option>
              </select>
            </div>
          </div>

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
              disabled={isLoading || !email || !fullName}
              className="bg-black text-white hover:bg-gray-900 h-11 px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajout en cours...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Ajouter le membre
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}




