"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
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
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle2, Chrome } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Image from "next/image";
import { env } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
  const pathParts = path.split('/');
  const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/');
  
  return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

const BUCKET_NAME = "Jessica CONTENTIN";
const SIGNUP_IMAGE_PATH = "mere enfant.jpg"; // Image pour la page d'inscription

const signupSchema = z
  .object({
    firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
    lastName: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
    email: z.string().email({ message: "Email invalide" }),
    password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function JessicaContentinSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setError(null);
    setSuccess(false);

    try {
      // Utiliser la route API qui utilise le service role client
      // Cela évite les problèmes de rate limit de Supabase
      const response = await fetch("/api/jessica-contentin/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Erreur de l'API
        setError(data.error || "Une erreur est survenue lors de la création du compte. Veuillez réessayer.");
        return;
      }

      // Succès
      if (data.warning) {
        // Compte créé mais email non envoyé
        toast.warning(data.message || "Compte créé, mais l'email de confirmation n'a pas pu être envoyé. Veuillez contacter le support.");
      } else {
        // Compte créé et email envoyé
        toast.success(`${values.firstName}, je viens de vous envoyer un mail pour valider votre inscription`);
      }

      setSuccess(true);
      
      // Rediriger vers l'URL spécifiée dans le paramètre redirect, ou vers les ressources par défaut
      const redirectUrl = searchParams.get("redirect") || "/jessica-contentin/ressources";
      
      // Attendre un peu pour que l'utilisateur voie le message de succès
      setTimeout(() => {
        router.push(redirectUrl);
        router.refresh();
      }, 2000);
      
      // Réinitialiser le formulaire
      form.reset();
    } catch (error) {
      console.error("[signup] Exception:", error);
      setError("Une erreur est survenue lors de la création du compte. Veuillez réessayer.");
    }
  };

  const isLoading = form.formState.isSubmitting;

  const handleGoogleSignUp = async () => {
    setError(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Service indisponible");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/jessica-contentin/ressources")}`,
      },
    });

    if (error) {
      setError(error.message || "Erreur lors de la connexion avec Google");
      toast.error("Erreur de connexion", {
        description: error.message,
      });
    }
  };

  // Couleurs de branding Jessica Contentin
  const bgColor = "#F8F5F0";
  const surfaceColor = "#FFFFFF";
  const textColor = "#2F2A25";
  const primaryColor = "#C6A664";
  const accentColor = "#D4AF37";

  const imageUrl = getSupabaseStorageUrl(BUCKET_NAME, SIGNUP_IMAGE_PATH) || 
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80";

  if (success && !form.formState.isSubmitting) {
    return (
      <>
        {/* Section avec image à gauche et message à droite */}
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

            {/* Message de succès à droite */}
            <div className="bg-[#F8F5F0] p-8 md:p-12 lg:p-16 flex flex-col justify-center">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-full max-w-md mx-auto lg:mx-0"
              >
                  <div className="mb-8">
                    <h1 
                      className="text-4xl md:text-5xl font-bold text-[#2F2A25] mb-4"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      }}
                    >
                      Compte créé !
                    </h1>
                    <p 
                      className="text-lg text-[#2F2A25]/80 leading-relaxed"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      }}
                    >
                      Vérifiez votre email pour confirmer votre compte
                    </p>
                  </div>

                  {/* Message de succès */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div 
                      className="rounded-2xl border p-8 shadow-lg text-center"
                      style={{ 
                        backgroundColor: surfaceColor,
                        borderColor: `${primaryColor}30`,
                      }}
                    >
                      <CheckCircle2 className="h-16 w-16 mx-auto mb-4" style={{ color: "#10B981" }} />
                      <p className="mb-6" style={{ color: textColor }}>
                        Un email de confirmation a été envoyé à votre adresse email.
                        Cliquez sur le lien dans l'email pour activer votre compte.
                      </p>
                      <Link href="/jessica-contentin/login">
                        <Button
                          className="rounded-full px-6"
                          style={{
                            backgroundColor: primaryColor,
                            color: '#FFFFFF',
                          }}
                        >
                          Aller à la page de connexion
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
      </>
    );
  }

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
                    Créer un compte
                  </h1>
                  <p 
                    className="text-lg text-[#2F2A25]/80 leading-relaxed"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    Rejoignez-nous pour accéder à tous nos contenus
                  </p>
                </div>

                {/* Formulaire d'inscription */}
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
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel style={{ color: textColor }}>Prénom</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: `${textColor}60` }} />
                                    <Input
                                      {...field}
                                      placeholder="Jean"
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
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel style={{ color: textColor }}>Nom</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Dupont"
                                    style={{ 
                                      backgroundColor: "#FFFFFF", 
                                      borderColor: `${primaryColor}30`,
                                      color: textColor
                                    }}
                                    disabled={isLoading}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

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

                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel style={{ color: textColor }}>Confirmer le mot de passe</FormLabel>
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
                          className="w-full rounded-full px-6 py-6 text-lg font-semibold mt-6"
                          style={{
                            backgroundColor: primaryColor,
                            color: '#FFFFFF',
                          }}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Création...
                            </>
                          ) : (
                            "Créer mon compte"
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
                      onClick={handleGoogleSignUp}
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

                    {/* Lien vers connexion */}
                    <div className="mt-6 text-center">
                      <p style={{ color: `${textColor}80` }} className="text-sm">
                        Déjà un compte ?{" "}
                        <Link 
                          href="/jessica-contentin/login"
                          className="font-semibold hover:underline"
                          style={{ color: primaryColor }}
                        >
                          Se connecter
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

