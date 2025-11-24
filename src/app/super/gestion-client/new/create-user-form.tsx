"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

const createUserSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  phone: z.string().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export function CreateUserForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  });

  const onSubmit = async (data: CreateUserFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: `${data.firstName} ${data.lastName}`,
          phone: data.phone || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la création du compte");
      }

      toast.success("Compte créé avec succès");
      router.push(`/super/utilisateurs-jessica/${result.userId}`);
    } catch (error: any) {
      console.error("[CreateUserForm] Error:", error);
      toast.error(error.message || "Erreur lors de la création du compte");
    } finally {
      setIsLoading(false);
    }
  };

  // Couleurs de branding Jessica Contentin
  const bgColor = "#FFFFFF";
  const surfaceColor = "#F8F5F0";
  const textColor = "#2F2A25";
  const primaryColor = "#C6A664";
  const secondaryColor = "#E6D9C6";

  return (
    <Card
      className="rounded-2xl border-2"
      style={{
        borderColor: secondaryColor,
        backgroundColor: bgColor,
      }}
    >
      <CardHeader>
        <CardTitle style={{ color: textColor }}>Informations du compte</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName" style={{ color: textColor }}>
                Prénom *
              </Label>
              <Input
                id="firstName"
                {...register("firstName")}
                className="rounded-lg border-2"
                style={{
                  borderColor: errors.firstName ? "#ef4444" : secondaryColor,
                  backgroundColor: bgColor,
                  color: textColor,
                }}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" style={{ color: textColor }}>
                Nom *
              </Label>
              <Input
                id="lastName"
                {...register("lastName")}
                className="rounded-lg border-2"
                style={{
                  borderColor: errors.lastName ? "#ef4444" : secondaryColor,
                  backgroundColor: bgColor,
                  color: textColor,
                }}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" style={{ color: textColor }}>
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              className="rounded-lg border-2"
              style={{
                borderColor: errors.email ? "#ef4444" : secondaryColor,
                backgroundColor: bgColor,
                color: textColor,
              }}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" style={{ color: textColor }}>
              Téléphone
            </Label>
            <Input
              id="phone"
              type="tel"
              {...register("phone")}
              className="rounded-lg border-2"
              style={{
                borderColor: errors.phone ? "#ef4444" : secondaryColor,
                backgroundColor: bgColor,
                color: textColor,
              }}
            />
            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" style={{ color: textColor }}>
              Mot de passe *
            </Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              className="rounded-lg border-2"
              style={{
                borderColor: errors.password ? "#ef4444" : secondaryColor,
                backgroundColor: bgColor,
                color: textColor,
              }}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
            <p className="text-xs" style={{ color: textColor, opacity: 0.6 }}>
              Le mot de passe doit contenir au moins 8 caractères
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-full px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              style={{
                backgroundColor: primaryColor,
                color: "white",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Créer le compte
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="rounded-full px-8 py-6 text-base"
              style={{
                borderColor: primaryColor,
                color: primaryColor,
                backgroundColor: "transparent",
              }}
            >
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

