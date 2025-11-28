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
import { Loader2, Mail, Lock, AlertCircle, ArrowLeft } from "lucide-react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    if (isSubmitting) {
      console.log("[beyond-connect/login] ⚠️ Already submitting, ignoring");
      return;
    }

    console.log("[beyond-connect/login] 🚀 Form submitted with email:", values.email);
    console.log("[beyond-connect/login] Form values:", values);
    setError(null);
    setIsSubmitting(true);
    
    // Vérifier que le formulaire est valide
    if (!values.email || !values.password) {
      console.error("[beyond-connect/login] ❌ Missing email or password");
      setError("Email et mot de passe requis");
      setIsSubmitting(false);
      return;
    }
    
    if (!supabase) {
      const errorMsg = "Supabase n'est pas configuré. Vérifiez les variables d'environnement.";
      setError(errorMsg);
      toast.error("Erreur de configuration", {
        description: "Les variables d'environnement Supabase ne sont pas configurées.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("[beyond-connect/login] 📡 Calling /api/auth/signin...");
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

      console.log("[beyond-connect/login] 📥 Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("[beyond-connect/login] ❌ API error:", errorData);
        setError(errorData.error || "Erreur de connexion");
        toast.error("Erreur de connexion", {
          description: errorData.error,
        });
        setIsSubmitting(false);
        return;
      }
      
      const result = await response.json();
      console.log("[beyond-connect/login] 📥 Response data:", { hasSession: !!result.session, hasUser: !!result.user, error: result.error });

      if (!response.ok) {
        setError(result.error || "Erreur de connexion");
        toast.error("Erreur de connexion", {
          description: result.error,
        });
        setIsSubmitting(false);
        return;
      }

      if (result.session && result.user) {
        console.log("[beyond-connect/login] ✅ Session received, setting session...");
        
        try {
          console.log("[beyond-connect/login] 🔐 Setting session with tokens...");
          console.log("[beyond-connect/login] Token lengths:", {
            access_token: result.session.access_token?.length || 0,
            refresh_token: result.session.refresh_token?.length || 0
          });
          
          // Ajouter un timeout pour éviter que ça reste bloqué
          const setSessionPromise = supabase.auth.setSession({
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token,
          });

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("setSession timeout after 5s")), 5000)
          );

          const sessionResult = await Promise.race([setSessionPromise, timeoutPromise]) as any;

          console.log("[beyond-connect/login] setSession result:", {
            hasData: !!sessionResult?.data,
            hasError: !!sessionResult?.error,
            errorMessage: sessionResult?.error?.message
          });

          if (sessionResult?.error) {
            console.error("[beyond-connect/login] ❌ Session error:", sessionResult.error);
            setError("Erreur lors de la création de la session");
            toast.error("Erreur de connexion", {
              description: sessionResult.error.message || "Impossible de créer la session",
            });
            setIsSubmitting(false);
            return;
          }

          console.log("[beyond-connect/login] ✅ Session set successfully:", { 
            hasSession: !!sessionResult?.data?.session, 
            hasUser: !!sessionResult?.data?.user 
          });
        } catch (sessionErr) {
          console.error("[beyond-connect/login] ❌ Exception setting session:", sessionErr);
          setError("Erreur lors de la création de la session");
          toast.error("Erreur de connexion", {
            description: sessionErr instanceof Error ? sessionErr.message : "Impossible de créer la session",
          });
          setIsSubmitting(false);
          return;
        }

        // Attendre un peu pour que la session soit bien propagée
        console.log("[beyond-connect/login] ⏳ Waiting 500ms for session propagation...");
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log("[beyond-connect/login] ✅ Wait complete");

        // Récupérer le profil pour déterminer le rôle
        console.log("[beyond-connect/login] 📋 Fetching profile for user:", result.user.id);
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, role")
          .eq("id", result.user.id)
          .single();

        if (profileError) {
          console.error("[beyond-connect/login] ❌ Profile error:", profileError);
          setError("Profil utilisateur introuvable");
          toast.error("Erreur", {
            description: profileError.message || "Impossible de récupérer votre profil",
          });
          setIsSubmitting(false);
          return;
        }

        if (!profile) {
          console.error("[beyond-connect/login] ❌ No profile found for user:", result.user.id);
          setError("Profil utilisateur introuvable");
          toast.error("Erreur", {
            description: "Impossible de récupérer votre profil",
          });
          setIsSubmitting(false);
          return;
        }

        console.log("[beyond-connect/login] ✅ Profile fetched:", { id: profile.id, role: profile.role });

        // Déterminer le chemin de redirection selon le rôle
        let redirectPath = searchParams.get("next");
        
        if (!redirectPath) {
          // Redirection simple selon le rôle
          if (profile.role === "admin" || profile.role === "instructor") {
            redirectPath = "/beyond-connect-app/companies";
            console.log("[beyond-connect/login] → Admin/instructor, redirecting to companies:", redirectPath);
          } 
          else if (profile.role === "learner" || profile.role === "student") {
            redirectPath = "/beyond-connect-app";
            console.log("[beyond-connect/login] → Learner/student, redirecting to app:", redirectPath);
          }
          else {
            // Par défaut, rediriger vers le dashboard principal
            redirectPath = "/dashboard";
            console.log("[beyond-connect/login] → Unknown role, redirecting to dashboard:", redirectPath);
          }
        }

        console.log("[beyond-connect/login] 🚀 Final redirect path:", redirectPath);
        
        // Réinitialiser l'état avant la redirection
        setIsSubmitting(false);
        
        // Afficher le toast
        toast.success("Connexion réussie !");
        
        // Utiliser window.location pour forcer une navigation complète
        // Petit délai pour laisser le toast s'afficher
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 300);
        return;
      } else {
        console.error("[beyond-connect/login] ❌ No session or user data received");
        setError("Aucune donnée utilisateur reçue");
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.error("[beyond-connect/login] ❌ Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue s'est produite";
      setError(errorMessage);
      toast.error("Erreur de connexion", {
        description: errorMessage,
      });
    } finally {
      // S'assurer que le formulaire se réinitialise
      setIsSubmitting(false);
      console.log("[beyond-connect/login] ✅ Form submission completed");
    }
  };

  const isLoading = isSubmitting || form.formState.isSubmitting;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Partie gauche - Image */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-[#003087] via-[#003087] to-[#002a7a] p-12">
        <div className="relative w-full h-full max-w-2xl">
          {/* Image placeholder - Vous pouvez remplacer par une vraie image */}
          <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-blue-800/20" />
            <Image
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
              alt="Homme et femme travaillant ensemble"
              fill
              className="object-cover"
              priority
            />
            {/* Overlay avec texte */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#003087]/90 via-[#003087]/50 to-transparent flex items-end p-12">
              <div className="text-white">
                <h2 className="text-3xl font-bold mb-4">
                  Bienvenue sur Beyond Connect
                </h2>
                <p className="text-lg text-blue-100">
                  Gérez votre CV numérique et trouvez les meilleures opportunités professionnelles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Partie droite - Formulaire */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Logo et retour */}
          <div className="mb-8">
            <Link href="/beyond-connect" className="inline-flex items-center gap-2 text-gray-600 hover:text-[#003087] mb-6">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Retour à la vitrine</span>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#003087] text-white font-bold text-xl">
                BC
              </div>
              <span className="text-2xl font-bold text-gray-900">Beyond Connect</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Connexion
            </h1>
            <p className="text-gray-600">
              Accédez à votre espace Beyond Connect
            </p>
          </div>

          {/* Message d'erreur */}
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

          {/* Formulaire */}
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(
                (data) => {
                  console.log("[beyond-connect/login] ✅ Form is valid, submitting:", data);
                  onSubmit(data);
                },
                (errors) => {
                  console.error("[beyond-connect/login] ❌ Form validation errors:", errors);
                }
              )} 
              className="space-y-6"
            >
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
                          className="h-12 rounded-lg border-gray-300 bg-white pl-12 text-gray-900 placeholder:text-gray-400 focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/20"
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
                          className="h-12 rounded-lg border-gray-300 bg-white pl-12 text-gray-900 placeholder:text-gray-400 focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/20"
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
                    className="h-12 w-full rounded-lg bg-[#003087] text-sm font-semibold text-white shadow-lg shadow-[#003087]/25 transition-all hover:bg-[#002a7a] hover:shadow-xl hover:shadow-[#003087]/40 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    disabled={isLoading}
                    onClick={(e) => {
                      console.log("[beyond-connect/login] 🔘 Button clicked, isLoading:", isLoading);
                      console.log("[beyond-connect/login] Form state:", form.formState);
                      console.log("[beyond-connect/login] Form values:", form.getValues());
                      console.log("[beyond-connect/login] Form errors:", form.formState.errors);
                      // Ne pas empêcher la soumission, laisser le formulaire gérer
                    }}
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
          <div className="mt-8 space-y-4 border-t border-gray-200 pt-6">
            <Link
              href="/forgot-password"
              className="block text-center text-sm text-gray-600 transition-colors hover:text-[#003087]"
            >
              Mot de passe oublié ?
            </Link>
            <p className="text-center text-sm text-gray-600">
              Pas encore de compte ?{" "}
              <Link
                href="/signup"
                className="font-medium text-[#003087] transition-colors hover:text-[#002a7a]"
              >
                Créer un compte
              </Link>
            </p>
            <p className="text-center text-xs text-gray-500 mt-4">
              Beyond Connect est réservé aux apprenants de Beyond No School.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BeyondConnectLoginPage() {
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

