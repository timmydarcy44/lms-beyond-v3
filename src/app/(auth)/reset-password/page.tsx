"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const resetSchema = z
  .object({
    password: z.string().min(6, { message: "Mot de passe trop court" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
  const supabase = useSupabase();
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const exchangeCodeForSession = async () => {
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const next = params.get("next") || "/dashboard/formateur";

      // Gérer les deux formats : code ou token_hash
      if (code) {
        // Échanger le code contre une session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          setError(exchangeError.message || "Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.");
          return;
        }
      } else if (tokenHash) {
        // Format avec token_hash - Supabase gère cela automatiquement via verifyOtp
        // On peut essayer de vérifier le token
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery'
        });

        if (verifyError) {
          setError(verifyError.message || "Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.");
          return;
        }
      } else {
        setError("Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation.");
        return;
      }
    };

    exchangeCodeForSession();
  }, [params, supabase]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setError(null);

    // Vérifier qu'on a bien une session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Session expirée. Veuillez demander un nouveau lien de réinitialisation.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (updateError) {
      setError(updateError.message);
      return;
    }

    toast.success("Mot de passe mis à jour avec succès");
    router.push("/login");
  };

  const isLoading = form.formState.isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réinitialiser le mot de passe</CardTitle>
        <CardDescription>
          Choisissez un nouveau mot de passe pour votre compte.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouveau mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour en cours
                </>
              ) : (
                "Mettre à jour le mot de passe"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <Button variant="link" onClick={() => router.push("/login")}>Revenir à la connexion</Button>
      </CardFooter>
    </Card>
  );
}


