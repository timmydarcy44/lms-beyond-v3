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
import { Loader2, Mail, Lock, AlertCircle, ArrowLeft, Music } from "lucide-react";
import { toast } from "sonner";
import { useSupabase } from "@/components/providers/supabase-provider";
import { motion } from "framer-motion";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Mot de passe trop court" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const type = searchParams.get("type");
    const tokenHash = searchParams.get("token_hash");
    const next = searchParams.get("next");
    
    if (code && type === "recovery") {
      const redirectUrl = `/reset-password?code=${code}${next ? `&next=${next}` : ""}`;
      router.replace(redirectUrl);
    } else if (tokenHash) {
      const redirectUrl = `/reset-password?token_hash=${tokenHash}${next ? `&next=${next}` : ""}`;
      router.replace(redirectUrl);
    } else if (code && !type) {
      const redirectUrl = `/reset-password?code=${code}${next ? `&next=${next}` : ""}`;
      router.replace(redirectUrl);
    }
  }, [searchParams, router]);

  return null;
}

function LoginForm() {
  const router = useRouter();
  const supabase = useSupabase();
  const searchParams = useSearchParams();
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
      const errorMsg = "Supabase n'est pas configuré. Vérifiez les variables d'environnement.";
      setError(errorMsg);
      toast.error("Erreur de configuration", {
        description: "Les variables d'environnement Supabase ne sont pas configurées.",
      });
      return;
    }

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Erreur de connexion");
        toast.error("Erreur de connexion", {
          description: result.error,
        });
        return;
      }

      if (result.session && result.user) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });

        if (sessionError) {
          setError("Erreur lors de la création de la session");
          toast.error("Erreur de connexion", {
            description: "Impossible de créer la session",
          });
          return;
        }

        toast.success("Connexion réussie !");
        
        const next = searchParams.get("next") || "/beyond-note-app";
        router.push(next);
        router.refresh();
        return;
      } else {
        setError("Aucune donnée utilisateur reçue");
        return;
      }
    } catch (err) {
      console.error("[beyond-note/login] Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue s'est produite";
      setError(errorMessage);
      toast.error("Erreur de connexion", {
        description: errorMessage,
      });
    }
  };

  const isLoading = form.formState.isSubmitting;
  const noteColor = "#A8E6CF";

  return (
    <div className="flex min-h-screen bg-white">
      {/* Partie gauche - Image */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-[#A8E6CF]/10 via-white to-white p-12">
        <div className="relative w-full h-full max-w-2xl">
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-[#A8E6CF]/20 to-[#A8E6CF]/10" />
            <Image
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
              alt="Beyond Note"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#A8E6CF]/90 via-[#A8E6CF]/50 to-transparent flex items-end p-12">
              <div className="text-black">
                <h2 className="text-3xl font-light mb-4">
                  Bienvenue sur Beyond Note
                </h2>
                <p className="text-lg text-black/80">
                  Organisez et structurez vos notes efficacement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partie droite - Formulaire */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link href="/beyond-note" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#A8E6CF] mb-6">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Retour à la vitrine</span>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg text-black" style={{ backgroundColor: noteColor }}>
                <Music className="h-6 w-6" />
              </div>
              <span className="text-2xl font-light text-gray-900">Beyond Note</span>
            </div>
            <h1 className="text-3xl font-light text-gray-900 mb-2">
              Connexion
            </h1>
            <p className="text-gray-600">
              Accédez à votre espace Beyond Note
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="vous@example.com"
                          autoComplete="email"
                          className="h-12 rounded-lg border-gray-300 bg-white pl-12 text-black placeholder:text-gray-400 focus:border-[#A8E6CF] focus:ring-2 focus:ring-[#A8E6CF]/20"
                          style={{ color: '#000000' }}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900">
                      Mot de passe
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className="h-12 rounded-lg border-gray-300 bg-white pl-12 text-black placeholder:text-gray-400 focus:border-[#A8E6CF] focus:ring-2 focus:ring-[#A8E6CF]/20"
                          style={{ color: '#000000' }}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-600" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="h-12 w-full rounded-lg text-sm font-light text-black shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                style={{ backgroundColor: noteColor }}
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

          <div className="mt-8 space-y-4 border-t border-gray-200 pt-6">
            <Link
              href="/forgot-password"
              className="block text-center text-sm text-gray-600 transition-colors hover:text-[#A8E6CF]"
            >
              Mot de passe oublié ?
            </Link>
            <p className="text-center text-sm text-gray-600">
              Pas encore de compte ?{" "}
              <Link
                href="/signup"
                className="font-medium transition-colors hover:opacity-80"
                style={{ color: noteColor }}
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BeyondNoteLoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <LoginRedirectHandler />
      </Suspense>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </>
  );
}

