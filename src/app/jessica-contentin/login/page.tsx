"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
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
import { Chrome } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import Image from "next/image";
import { env } from "@/lib/env";

// Fonction pour construire l'URL Supabase Storage
function getSupabaseStorageUrl(bucket: string, path: string): string {
  const supabaseUrl = 
    env.supabaseUrl || 
    (typeof window !== 'undefined' ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL : undefined) ||
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined);
  
  if (!supabaseUrl) {
    return "";
  }
  
  const encodedBucket = encodeURIComponent(bucket);
  // Encoder chaque partie du chemin, y compris les espaces
  const pathParts = path.split('/');
  const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/');
  
  return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

const BUCKET_NAME = "Jessica CONTENTIN";
const LOGIN_IMAGE_PATH = "femme soleil.jpg"; // Image pour la page de login

const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Mot de passe trop court" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Vérifier si l'utilisateur est déjà connecté
  const checkAuth = async () => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const next = searchParams.get("next") || "/jessica-contentin/ressources";
      router.push(next);
    }
  };

  checkAuth();
  return null;
}

function LoginForm() {
  const router = useRouter();
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

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Service indisponible");
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (signInError) {
      setError(signInError.message || "Email ou mot de passe incorrect");
      return;
    }

    if (!data.user) {
      setError("Une erreur est survenue lors de la connexion");
      return;
    }

    // Récupérer le prénom de l'utilisateur
    let firstName = "";
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", data.user.id)
        .maybeSingle();
      
      if (profile?.full_name) {
        // Extraire le prénom (premier mot du full_name)
        firstName = profile.full_name.split(" ")[0] || "";
      }
    } catch (error) {
      console.error("[login] Error fetching user profile:", error);
    }

    // Afficher le popup de succès
    toast.success("Connexion réussie");
    
    // Afficher le message de bienvenue après un court délai
    setTimeout(() => {
      if (firstName) {
        toast.success(`Bonjour ${firstName}`);
      }
    }, 500);

    const next = searchParams.get("next") || "/jessica-contentin/ressources";
    router.push(next);
    router.refresh();
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Service indisponible");
      return;
    }

    const next = searchParams.get("next") || "/jessica-contentin/ressources";
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message || "Erreur lors de la connexion avec Google");
      toast.error("Erreur de connexion", {
        description: error.message,
      });
    }
  };

  const isLoading = form.formState.isSubmitting;

  // Couleurs de branding Jessica Contentin
  const bgColor = "#F8F5F0";
  const surfaceColor = "#FFFFFF";
  const textColor = "#2F2A25";
  const primaryColor = "#C6A664";
  const accentColor = "#D4AF37";

  const imageUrl = getSupabaseStorageUrl(BUCKET_NAME, LOGIN_IMAGE_PATH) || 
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80";

  return (
    <>
      {/* Section avec image à gauche et formulaire à droite */}
      <div className="min-h-screen bg-[#F8F5F0]">
        <div className="grid lg:grid-cols-2 min-h-screen">
          {/* Image à gauche */}
          <div className="hidden lg:block relative overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <Image
                src={imageUrl}
                alt="Jessica CONTENTIN - Psychopédagogue certifiée en neuroéducation"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 0vw, 50vw"
                priority
                unoptimized={!!imageUrl && imageUrl.includes('supabase')}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('unsplash')) {
                    target.src = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80";
                  }
                }}
              />
            </motion.div>
          </div>

          {/* Formulaire à droite */}
          <div className="bg-[#F8F5F0] p-8 md:p-12 lg:p-16 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full max-w-md mx-auto lg:mx-0"
            >
                {/* Titre */}
                <div className="mb-8">
                  <h1 
                    className="text-4xl md:text-5xl font-bold text-[#2F2A25] mb-4"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    Connexion
                  </h1>
                  <p 
                    className="text-lg text-[#2F2A25]/80 leading-relaxed"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    Accédez à votre espace personnel
                  </p>
                </div>

                {/* Formulaire de connexion */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div 
                    className="rounded-2xl border p-8 shadow-lg"
                    style={{ 
                      backgroundColor: surfaceColor,
                      borderColor: `${primaryColor}30`,
                    }}
                  >
                    {/* Message d'erreur */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 flex items-center gap-3 rounded-xl border p-4 text-sm"
                        style={{
                          borderColor: "#DC2626",
                          backgroundColor: "#FEE2E2",
                          color: "#DC2626",
                        }}
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
                              <FormLabel style={{ color: textColor }}>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: `${textColor}60` }} />
                                  <Input
                                    {...field}
                                    type="email"
                                    placeholder="votre@email.com"
                                    className="pl-10"
                                    style={{ 
                                      backgroundColor: "#FFFFFF", 
                                      borderColor: `${primaryColor}30`,
                                      color: textColor
                                    }}
                                    disabled={isLoading}
                                  />
                                </div>
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
                              <FormLabel style={{ color: textColor }}>Mot de passe</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: `${textColor}60` }} />
                                  <Input
                                    {...field}
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    style={{ 
                                      backgroundColor: "#FFFFFF", 
                                      borderColor: `${primaryColor}30`,
                                      color: textColor
                                    }}
                                    disabled={isLoading}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full rounded-full px-6 py-6 text-lg font-semibold"
                          style={{
                            backgroundColor: primaryColor,
                            color: '#FFFFFF',
                          }}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Connexion...
                            </>
                          ) : (
                            "Se connecter"
                          )}
                        </Button>
                      </form>
                    </Form>

                    {/* Séparateur */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t" style={{ borderColor: `${primaryColor}30` }}></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span style={{ color: `${textColor}60`, backgroundColor: surfaceColor }} className="px-2">
                          ou
                        </span>
                      </div>
                    </div>

                    {/* Bouton Google */}
                    <Button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full rounded-full px-6 py-6 text-lg font-semibold border-2"
                      style={{
                        borderColor: `${primaryColor}40`,
                        backgroundColor: surfaceColor,
                        color: textColor,
                      }}
                    >
                      <Chrome className="mr-2 h-5 w-5" />
                      Continuer avec Google
                    </Button>

                    {/* Lien vers inscription */}
                    <div className="mt-6 text-center">
                      <p style={{ color: `${textColor}80` }} className="text-sm">
                        Pas encore de compte ?{" "}
                        <Link 
                          href="/jessica-contentin/inscription"
                          className="font-semibold hover:underline"
                          style={{ color: primaryColor }}
                        >
                          Créer un compte
                        </Link>
                      </p>
                    </div>
                  </div>
                </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function JessicaContentinLoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <LoginRedirectHandler />
      </Suspense>
      <Suspense fallback={
        <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#C6A664" }} />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </>
  );
}

