"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUserAction } from "@/app/super/utilisateurs/new/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type CreateUserFormProps = {
  defaultRole?: string;
};

export function CreateUserForm({ defaultRole }: CreateUserFormProps = {}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"instructor" | "learner" | "tutor" | "admin">(
    (defaultRole === "admin" ? "admin" : "learner") as "instructor" | "learner" | "tutor" | "admin"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await createUserAction({
        email,
        fullName,
        role: role as "instructor" | "learner" | "tutor" | "admin",
        organizationIds: [],
      });

      if (result.success) {
        toast.success("Utilisateur créé avec succès !");
        router.push(`/super/utilisateurs/${result.userId}`);
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
          <Label htmlFor="email" className="text-gray-900">
            Email *
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemple.com"
            required
            className="mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900"
          />
        </div>

        <div>
          <Label htmlFor="fullName" className="text-gray-900">
            Nom complet *
          </Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jean Dupont"
            required
            className="mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900"
          />
        </div>

        <div>
          <Label htmlFor="role" className="text-gray-900">
            Rôle *
          </Label>
            <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-gray-900 focus:outline-none"
          >
            <option value="admin">Administrateur</option>
            <option value="instructor">Formateur</option>
            <option value="learner">Apprenant</option>
            <option value="tutor">Tuteur</option>
          </select>
        </div>
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
          disabled={isLoading || !email || !fullName}
          className="bg-black text-white hover:bg-gray-900"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Création...
            </>
          ) : (
            "Créer l'utilisateur"
          )}
        </Button>
      </div>
    </form>
  );
}
