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
import { Loader2, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
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
  const pathParts = path.split('/');
  const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/');
  
  return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

const BUCKET_NAME = "Jessica CONTENTIN";
const FORGOT_PASSWORD_IMAGE_PATH = "femme soleil.jpg";

const resetSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function JessicaContentinForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ResetFormValues) => {
    setError(null);
    setSuccess(false);

    try {
      // Appeler l'API pour envoyer l'email via BREVO
      const response = await fetch("/api/emails/send-password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: values.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      setSuccess(true);
      toast.success("Email de réinitialisation envoyé");
      form.reset();
    } catch (err) {
      setError("Une erreur est survenue lors de l'envoi de l'email");
      console.error("[forgot-password] Error:", err);
    }
  };

  const isLoading = form.formState.isSubmitting;

  // Couleurs de branding Jessica Contentin
  const bgColor = "#F8F5F0";
  const surfaceColor = "#FFFFFF";
  const textColor = "#2F2A25";
  const primaryColor = "#C6A664";
  const accentColor = "#D4AF37";

  const imageUrl = getSupabaseStorageUrl(BUCKET_NAME, FORGOT_PASSWORD_IMAGE_PATH) || 
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80";

  if (success) {
    return (
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
                  Email envoyé !
                </h1>
                <p 
                  className="text-lg text-[#2F2A25]/80 leading-relaxed"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Vérifiez votre boîte email pour réinitialiser votre mot de passe
                </p>
              </div>

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
                  <p className="mb-6" style={{ color: textColor }}>
                    Un email avec un lien de réinitialisation a été envoyé à votre adresse email.
                    Cliquez sur le lien dans l'email pour créer un nouveau mot de passe.
                  </p>
                  <Link href="/jessica-contentin/login">
                    <Button
                      className="rounded-full px-6"
                      style={{
                        backgroundColor: primaryColor,
                        color: '#FFFFFF',
                      }}
                    >
                      Retour à la connexion
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
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
            <div className="mb-8">
              <h1 
                className="text-4xl md:text-5xl font-bold text-[#2F2A25] mb-4"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Mot de passe oublié ?
              </h1>
              <p 
                className="text-lg text-[#2F2A25]/80 leading-relaxed"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Entrez votre email et nous vous enverrons un lien de réinitialisation
              </p>
            </div>

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

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-[#2F2A25]">Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#2F2A25]/60" />
                              <Input
                                type="email"
                                placeholder="votre@email.com"
                                autoComplete="email"
                                className="h-12 rounded-xl border-white/20 bg-white/5 pl-12 text-[#2F2A25] placeholder:text-[#2F2A25]/40 focus:border-[#C6A664] focus:ring-2 focus:ring-[#C6A664]/20"
                                style={{ borderColor: `${primaryColor}30` }}
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
                      className="h-12 w-full rounded-xl bg-gradient-to-r from-[#C6A664] to-[#D4AF37] text-sm font-semibold text-white shadow-lg shadow-[#C6A664]/25 transition-all hover:shadow-xl hover:shadow-[#C6A664]/40 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        "Envoyer le lien"
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="mt-6 border-t border-[#E6D9C6] pt-6">
                  <Link
                    href="/jessica-contentin/login"
                    className="block text-center text-sm text-[#2F2A25]/70 transition-colors hover:text-[#C6A664]"
                  >
                    Retour à la connexion
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

