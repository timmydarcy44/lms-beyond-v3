"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSupabase } from "@/components/providers/supabase-provider";

const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Mot de passe trop court" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Rediriger vers reset-password si un code de réinitialisation est présent
  useEffect(() => {
    const code = searchParams.get("code");
    const type = searchParams.get("type");
    const tokenHash = searchParams.get("token_hash");
    const next = searchParams.get("next");
    
    // Si c'est un lien de réinitialisation de mot de passe, rediriger vers la page dédiée
    // Supabase peut envoyer soit "code" avec "type=recovery", soit "token_hash"
    if (code && type === "recovery") {
      const redirectUrl = `/reset-password?code=${code}${next ? `&next=${next}` : ""}`;
      router.replace(redirectUrl);
    } else if (tokenHash) {
      // Format alternatif avec token_hash
      const redirectUrl = `/reset-password?token_hash=${tokenHash}${next ? `&next=${next}` : ""}`;
      router.replace(redirectUrl);
    } else if (code && !type) {
      // Si on a un code sans type, vérifier si c'est un code de réinitialisation
      // En essayant d'échanger le code, on saura s'il est valide
      // Pour l'instant, on redirige vers reset-password si on a un code
      const redirectUrl = `/reset-password?code=${code}${next ? `&next=${next}` : ""}`;
      router.replace(redirectUrl);
    }
  }, [searchParams, router]);

  const onSubmit = async (values: LoginFormValues) => {
    setError(null);
    
    if (!supabase) {
      setError("Supabase n'est pas configuré. Vérifiez les variables d'environnement.");
      console.error("[login] Supabase provider not available");
      return;
    }

    try {
      console.log("[login] Attempting sign in with Supabase");
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      console.debug("[login] signIn response:", {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        authError,
      });

      if (authError) {
        setError(authError.message || "Erreur de connexion");
        toast.error("Erreur de connexion", {
          description: authError.message,
        });
        return;
      }

      if (data?.user) {
        toast.success("Connexion réussie !");
        console.log("[login] Sign in succeeded, redirecting to /loading");
        // Rediriger vers la page de chargement qui affichera "Bonjour (prénom)" puis redirigera vers le dashboard
        router.push("/loading");
        router.refresh(); // Forcer le rafraîchissement pour récupérer la session
      }
    } catch (err) {
      console.error("[login] Unexpected error during sign in:", err);
      const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue s'est produite";
      setError(errorMessage);
      toast.error("Erreur de connexion", {
        description: errorMessage,
      });
    }
  };

  const isLoading = form.formState.isSubmitting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Accédez à votre espace en tant qu&apos;apprenant, formateur, tuteur ou
          admin.
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="vous@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Pas encore de compte ? {" "}
          <Link href="/signup" className="text-primary hover:underline">
            Créer un compte
          </Link>
        </p>
        <Link href="/forgot-password" className="text-sm text-primary">
          Mot de passe oublié ?
        </Link>
      </CardFooter>
    </Card>
  );
}


