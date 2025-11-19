"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useSupabase } from "@/components/providers/supabase-provider";
import { BeyondWordmark } from "@/components/ui/beyond-wordmark";
import { motion } from "framer-motion";

const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Mot de passe trop court" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  return null;
}

function LoginForm() {
  const router = useRouter();
  const supabase = useSupabase();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Logo Beyond - visible uniquement sur mobile */}
      <div className="mb-12 flex justify-center lg:hidden">
        <BeyondWordmark 
          size="lg" 
          className="text-white"
        />
      </div>

      {/* Card de connexion */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-semibold text-white">
            Connexion
          </h1>
          <p className="text-sm text-white/60">
            Accédez à votre espace d&apos;apprentissage
          </p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Formulaire */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-white/90">
                    Email
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                      <Input
                        type="email"
                        placeholder="vous@example.com"
                        autoComplete="email"
                        className="h-12 rounded-xl border-white/20 bg-white/5 pl-12 text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/20"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-white/90">
                    Mot de passe
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="h-12 rounded-xl border-white/20 bg-white/5 pl-12 text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/20"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>
        </Form>

        {/* Liens supplémentaires */}
        <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
          <Link
            href="/forgot-password"
            className="block text-center text-sm text-white/70 transition-colors hover:text-white"
          >
            Mot de passe oublié ?
          </Link>
          <p className="text-center text-sm text-white/60">
            Pas encore de compte ?{" "}
            <Link
              href="/signup"
              className="font-medium text-white transition-colors hover:text-blue-400"
            >
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <LoginRedirectHandler />
      </Suspense>
      <LoginForm />
    </>
  );
}


