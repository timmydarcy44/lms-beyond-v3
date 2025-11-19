"use client";

import Link from "next/link";
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
import { useSupabase } from "@/components/providers/supabase-provider";
import { Loader2, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { BeyondWordmark } from "@/components/ui/beyond-wordmark";
import { motion } from "framer-motion";

const resetSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const supabase = useSupabase();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ResetFormValues) => {
    setError(null);

    // Utiliser NEXT_PUBLIC_APP_URL si disponible (production), sinon window.location.origin (développement)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const redirectUrl = `${baseUrl}/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      values.email,
      {
        redirectTo: redirectUrl,
      },
    );

    if (resetError) {
      setError(resetError.message);
      return;
    }

    toast.success("Email de réinitialisation envoyé");
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

      {/* Card de mot de passe oublié */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-semibold text-white">
            Mot de passe oublié
          </h1>
          <p className="text-sm text-white/60">
            Entrez votre email et nous vous enverrons un lien de réinitialisation.
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
            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours
                </>
              ) : (
                "Envoyer le lien"
              )}
            </Button>
          </form>
        </Form>

        {/* Lien retour */}
        <div className="mt-6 border-t border-white/10 pt-6">
          <Link
            href="/login"
            className="block text-center text-sm text-white/70 transition-colors hover:text-white"
          >
            Revenir à la connexion
          </Link>
        </div>
      </div>
    </motion.div>
  );
}







