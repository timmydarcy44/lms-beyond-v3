"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { JessicaSuperButton, JessicaSuperCard } from "@/components/jessica-contentin/super/jessica-super-ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

const createClientSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Email invalide"),
  phone: z.string().optional(),
});

type CreateClientFormData = z.infer<typeof createClientSchema>;

export function JessicaCrmCreateClientForm({
  redirectTo = "/super/jessica-crm",
}: {
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
  });

  const onSubmit = async (data: CreateClientFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/jessica-crm/create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email || null,
          phone: data.phone || null,
        }),
      });

      const result = (await response.json()) as {
        error?: string;
        clientId?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la création du client");
      }

      toast.success("Client ajouté");
      router.push(result.clientId ? `/super/jessica-crm/${result.clientId}` : redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <JessicaSuperCard title="Nouveau client">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom *</Label>
            <Input id="firstName" {...register("firstName")} className="rounded-xl border-black/[0.08]" />
            {errors.firstName ? <p className="text-sm text-red-500">{errors.firstName.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom *</Label>
            <Input id="lastName" {...register("lastName")} className="rounded-xl border-black/[0.08]" />
            {errors.lastName ? <p className="text-sm text-red-500">{errors.lastName.message}</p> : null}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Adresse email</Label>
          <Input id="email" type="email" {...register("email")} className="rounded-xl border-black/[0.08]" />
          {errors.email ? <p className="text-sm text-red-500">{errors.email.message}</p> : null}
          <p className="text-xs text-neutral-500">Utile pour envoyer les factures.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" type="tel" {...register("phone")} className="rounded-xl border-black/[0.08]" />
        </div>
        <div className="flex gap-4 pt-4">
          <JessicaSuperButton type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Création…
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Ajouter le client
              </>
            )}
          </JessicaSuperButton>
          <JessicaSuperButton type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </JessicaSuperButton>
        </div>
      </form>
    </JessicaSuperCard>
  );
}
