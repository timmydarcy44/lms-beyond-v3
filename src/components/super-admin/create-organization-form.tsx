"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});

    try {
      const data = {
        name: typeof name === "string" ? name : "",
        slug: slug || undefined,
      };
      console.log("PAYLOAD ENVOYÉ:", JSON.stringify(data));

      const res = await fetch("/api/super-admin/organisations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (res.ok && json?.ok) {
        toast.success("Organisation créée avec succès !");
        const newId = json.organization?.id; // Extraction précise depuis { organization: { id: '...' } }

        if (newId) {
          router.refresh();
          router.push("/super/organisations/" + newId + "/manage");
        } else {
          console.error("ID non trouvé dans la réponse API", json);
          toast.error("Création OK mais redirection impossible", {
            description: "ID de l'organisation introuvable dans la réponse API.",
          });
        }
      } else {
        if (json?.fieldErrors) {
          setFieldErrors(json.fieldErrors);
        }
        toast.error(json?.error ? `Impossible de créer l'organisation : ${json.error}` : "Erreur lors de la création");
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
            className={`mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900 ${fieldErrors.name ? "border-red-500" : ""}`}
          />
          {fieldErrors.name ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
          ) : null}
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

        {/* Champs retirés: description/logo/couleurs non présents en base selon l'audit SQL */}
      </div>

      {/* Membres retirés: non gérés par le schéma minimal audité */}

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
