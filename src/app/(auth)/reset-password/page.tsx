"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
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
import { useSupabase } from "@/components/providers/supabase-provider";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { BeyondWordmark } from "@/components/ui/beyond-wordmark";
import { motion } from "framer-motion";
import {
  PasswordStrengthIndicator,
  calculatePasswordStrength,
} from "@/components/ui/password-strength-indicator";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" })
      .refine(
        (password) => {
          const strength = calculatePasswordStrength(password);
          return (
            strength.meetsRequirements.minLength &&
            strength.meetsRequirements.hasNumber &&
            strength.meetsRequirements.hasSpecialChar
          );
        },
        {
          message:
            "Le mot de passe doit contenir au moins 6 caractères, un chiffre et un caractère spécial",
        }
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetSchema>;

function ResetPasswordCodeHandler({ onError }: { onError: (error: string) => void }) {
  const supabase = useSupabase();
  const params = useSearchParams();

  useEffect(() => {
    const exchangeCodeForSession = async () => {
      const code = params.get("code");
      const tokenHash = params.get("token_hash");

      // Gérer les deux formats : code ou token_hash
      if (code) {
        // Échanger le code contre une session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          onError(
            exchangeError.message ||
              "Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation."
          );
          return;
        }
      } else if (tokenHash) {
        // Format avec token_hash - Supabase gère cela automatiquement via verifyOtp
        // On peut essayer de vérifier le token
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

        if (verifyError) {
          onError(
            verifyError.message ||
              "Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation."
          );
          return;
        }
      } else {
        onError(
          "Lien invalide ou expiré. Veuillez demander un nouveau lien de réinitialisation."
        );
        return;
      }
    };

    exchangeCodeForSession();
  }, [params, supabase, onError]);

  return null;
}

function ResetPasswordForm() {
  const supabase = useSupabase();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = form.watch("password");

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setError(null);

    // Vérifier qu'on a bien une session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setError(
        "Session expirée. Veuillez demander un nouveau lien de réinitialisation."
      );
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Logo Beyond - visible uniquement sur mobile */}
      <div className="mb-12 flex justify-center lg:hidden">
        <BeyondWordmark size="lg" className="text-white" />
      </div>

      {/* Card de réinitialisation */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-semibold text-white">
            Réinitialiser le mot de passe
          </h1>
          <p className="text-sm text-white/60">
            Choisissez un nouveau mot de passe sécurisé pour votre compte.
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

        <Suspense fallback={null}>
          <ResetPasswordCodeHandler onError={setError} />
        </Suspense>

        {/* Formulaire */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-white/90">
                    Nouveau mot de passe
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="h-12 rounded-xl border-white/20 bg-white/5 pl-12 text-white placeholder:text-white/40 focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/20"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  {passwordValue && (
                    <PasswordStrengthIndicator password={passwordValue} />
                  )}
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-white/90">
                    Confirmer le mot de passe
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
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
                  Mise à jour en cours
                </>
              ) : (
                "Mettre à jour le mot de passe"
              )}
            </Button>
          </form>
        </Form>

        {/* Lien retour */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <Button
            variant="link"
            onClick={() => router.push("/login")}
            className="w-full text-sm text-white/70 transition-colors hover:text-white"
          >
            Revenir à la connexion
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
