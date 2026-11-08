"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function CreateOrganizationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [siret, setSiret] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [addressZip, setAddressZip] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setFieldErrors({});

    try {
      const data = {
        name: typeof name === "string" ? name : "",
        slug: slug || undefined,
        siret,
        address_line: addressLine,
        address_zip: addressZip,
        address_city: addressCity,
        address_country: "FR",
      };

      const res = await fetch("/api/super-admin/organisations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (res.ok && json?.ok) {
        toast.success("Organisation créée avec succès !");
        const newId = json.organization?.id;

        if (newId) {
          router.refresh();
          router.push("/super/organisations/" + newId + "/manage");
        } else {
          toast.error("Création OK mais redirection impossible", {
            description: "ID de l'organisation introuvable dans la réponse API.",
          });
        }
      } else {
        if (json?.fieldErrors) {
          const cleaned: Record<string, string> = {};
          for (const [k, v] of Object.entries(json.fieldErrors as Record<string, string | undefined>)) {
            if (v) cleaned[k] = v;
          }
          setFieldErrors(cleaned);
        }
        toast.error(
          json?.details || json?.error
            ? `Impossible de créer l'organisation : ${json.details || json.error}`
            : "Erreur lors de la création",
        );
      }
    } catch (error) {
      toast.error("Une erreur est survenue");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit =
    Boolean(name.trim()) &&
    siret.replace(/\D/g, "").length === 14 &&
    Boolean(addressLine.trim()) &&
    Boolean(addressZip.trim()) &&
    Boolean(addressCity.trim());

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-gray-900">
            Nom de l&apos;organisation *
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Beyond Learning"
            required
            className={`mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900 ${fieldErrors.name ? "border-red-500" : ""}`}
          />
          {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
        </div>

        <div>
          <Label htmlFor="siret" className="text-gray-900">
            SIRET *
          </Label>
          <Input
            id="siret"
            value={siret}
            onChange={(e) => setSiret(e.target.value)}
            placeholder="14 chiffres"
            required
            className={`mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900 ${fieldErrors.siret ? "border-red-500" : ""}`}
          />
          {fieldErrors.siret ? <p className="mt-1 text-xs text-red-600">{fieldErrors.siret}</p> : null}
        </div>

        <div>
          <Label htmlFor="address_line" className="text-gray-900">
            Adresse (n° et rue) *
          </Label>
          <Input
            id="address_line"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            placeholder="12 rue de la Paix"
            required
            className={`mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900 ${fieldErrors.address_line ? "border-red-500" : ""}`}
          />
          {fieldErrors.address_line ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.address_line}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <div>
            <Label htmlFor="address_zip" className="text-gray-900">
              Code postal *
            </Label>
            <Input
              id="address_zip"
              value={addressZip}
              onChange={(e) => setAddressZip(e.target.value)}
              required
              className={`mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900 ${fieldErrors.address_zip ? "border-red-500" : ""}`}
            />
          </div>
          <div>
            <Label htmlFor="address_city" className="text-gray-900">
              Ville *
            </Label>
            <Input
              id="address_city"
              value={addressCity}
              onChange={(e) => setAddressCity(e.target.value)}
              required
              className={`mt-2 border-gray-300 bg-white text-gray-900 focus:border-gray-900 ${fieldErrors.address_city ? "border-red-500" : ""}`}
            />
          </div>
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
          <p className="mt-1 text-xs text-gray-500">Généré automatiquement si vide (basé sur le nom)</p>
        </div>
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
          disabled={isLoading || !canSubmit}
          className="bg-black text-white hover:bg-gray-900"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
