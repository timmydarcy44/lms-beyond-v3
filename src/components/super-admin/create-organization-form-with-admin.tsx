"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function CreateOrganizationFormWithAdmin() {
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
      const res = await fetch("/api/super-admin/organisations/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug: slug || undefined,
          // Schéma SQL audité: organizations = { id, name, slug, created_at, updated_at }
        }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json?.ok) {
        toast.success("Organisation créée avec succès !");
        router.push(`/super/organisations/${json.organization?.id}`);
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
            className={`mt-2 h-11 border-gray-300 bg-white text-gray-900 focus:border-gray-900 ${fieldErrors.name ? "border-red-500" : ""}`}
          />
          {fieldErrors.name ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
          ) : null}
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

        {/* Champs retirés: description/logo/couleurs/admin/membres non présents en base selon l'audit SQL */}
      </div>

      {/* Sections retirées: admin/membres/logo non présents en base selon l'audit SQL */}

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
          disabled={isLoading || !name}
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





