"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUserAction } from "@/app/super/utilisateurs/new/actions";
import { CRM_PROFILE_ROLE_OPTIONS, type CrmProfileRole } from "@/lib/crm/crm-shared";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type CreateUserFormProps = {
  defaultRole?: string;
};

function resolveDefaultRole(defaultRole?: string): CrmProfileRole {
  const allowed = CRM_PROFILE_ROLE_OPTIONS.map((option) => option.value);
  if (defaultRole && allowed.includes(defaultRole as CrmProfileRole)) {
    return defaultRole as CrmProfileRole;
  }
  if (defaultRole === "instructor") return "instructor";
  if (defaultRole === "tutor") return "tutor";
  if (defaultRole === "btoc") return "PARTICULIER";
  return "learner";
}

export function CreateUserForm({ defaultRole }: CreateUserFormProps = {}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<CrmProfileRole>(resolveDefaultRole(defaultRole));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await createUserAction({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
        role,
        organizationIds: [],
      });

      if (result.success) {
        if (result.warning) {
          toast.warning(result.warning);
        } else if (result.inviteSent) {
          toast.success("Utilisateur créé — un email de création de mot de passe a été envoyé");
        } else {
          toast.success("Utilisateur créé avec succès");
        }
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName" className="text-gray-900">
            Prénom *
          </Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jean"
            required
            className="mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900"
          />
        </div>
        <div>
          <Label htmlFor="lastName" className="text-gray-900">
            Nom *
          </Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Dupont"
            required
            className="mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900"
          />
        </div>
      </div>

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
        <Label htmlFor="phone" className="text-gray-900">
          Téléphone
        </Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="06 12 34 56 78"
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
          onChange={(e) => setRole(e.target.value as CrmProfileRole)}
          className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-gray-900 focus:outline-none"
        >
          {CRM_PROFILE_ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
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
          disabled={isLoading || !email || !firstName || !lastName}
          className="bg-black text-white hover:bg-gray-900"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
