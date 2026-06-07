"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Mail, Lock, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { env } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

function getSupabaseStorageUrl(bucket: string, path: string): string {
  const supabaseUrl =
    env.supabaseUrl ||
    (typeof window !== "undefined"
      ? (window as unknown as { __NEXT_DATA__?: { env?: { NEXT_PUBLIC_SUPABASE_URL?: string } } }).__NEXT_DATA__
          ?.env?.NEXT_PUBLIC_SUPABASE_URL
      : undefined) ||
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined);

  if (!supabaseUrl) {
    return "";
  }

  const encodedBucket = encodeURIComponent(bucket);
  const pathParts = path.split("/");
  const encodedPath = pathParts.map((part) => encodeURIComponent(part)).join("/");

  return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

const BUCKET_NAME = "Jessica CONTENTIN";
const LOGIN_IMAGE_PATH = "Jessica contentin re.jpg";

const textColor = "#2F2A25";
const primaryColor = "#C6A664";
const surfaceColor = "#FFFFFF";

function postLoginDestination(searchParams: URLSearchParams): string {
  const next = searchParams.get("next")?.trim();
  const redirect = searchParams.get("redirect")?.trim();
  const raw = next || redirect;
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return "/jessica-contentin/mon-compte";
}

export default function JessicaContentinLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F5F0]" />}>
      <JessicaContentinLoginContent />
    </Suspense>
  );
}

function JessicaContentinLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const imageUrl =
    getSupabaseStorageUrl(BUCKET_NAME, LOGIN_IMAGE_PATH) ||
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80";

  const dest = postLoginDestination(searchParams);

  useEffect(() => {
    if (searchParams.get("confirmed") === "true") {
      toast.success("Compte confirmé — vous pouvez vous connecter.");
    }
    const err = searchParams.get("error");
    if (err === "confirmation_failed") {
      toast.error("La confirmation a échoué. Réessayez ou contactez le support.");
    } else if (err === "invalid_link") {
      toast.error("Lien invalide ou expiré.");
    } else if (err === "user_not_found") {
      toast.error("Utilisateur introuvable.");
    } else if (err === "service_unavailable") {
      toast.error("Service temporairement indisponible.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setError("Service indisponible");
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message || "Identifiants incorrects.");
        return;
      }
      let destination = dest;
      try {
        const res = await fetch("/api/auth/resolve-destination", { method: "POST" });
        if (res.ok) {
          const payload = (await res.json()) as { destination?: string };
          if (payload.destination?.startsWith("/")) {
            destination = payload.destination;
          }
        }
      } catch {
        // fallback dest
      }
      router.push(destination);
      router.refresh();
    } catch {
      setError("Impossible de se connecter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Service indisponible");
      return;
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(dest)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message || "Erreur lors de la connexion avec Google");
      toast.error(oauthError.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden lg:block">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <Image
              src={imageUrl}
              alt="Jessica CONTENTIN — psychopédagogue"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 0vw, 50vw"
              priority
              unoptimized={!!imageUrl && imageUrl.includes("supabase")}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes("unsplash")) {
                  target.src = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80";
                }
              }}
            />
          </motion.div>
        </div>

        <div className="flex flex-col justify-center bg-[#F8F5F0] p-8 md:p-12 lg:p-16">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto w-full max-w-md lg:mx-0"
          >
            <div className="mb-8">
              <h1
                className="mb-2 text-4xl font-bold text-[#2F2A25] md:text-5xl"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Connexion
              </h1>
              <p
                className="text-lg leading-relaxed text-[#2F2A25]/80"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Accédez à votre espace et à vos ressources.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: textColor }}>
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: `${textColor}60` }} />
                  <Input
                    type="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    placeholder="votre@email.com"
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderColor: `${primaryColor}30`,
                      color: textColor,
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" style={{ color: textColor }}>
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: `${textColor}60` }} />
                  <Input
                    type="password"
                    value={password}
                    onChange={(ev) => setPassword(ev.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderColor: `${primaryColor}30`,
                      color: textColor,
                    }}
                  />
                </div>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full px-6 py-6 text-lg font-semibold"
                style={{
                  backgroundColor: primaryColor,
                  color: "#FFFFFF",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connexion…
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: `${primaryColor}30` }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span style={{ color: `${textColor}60`, backgroundColor: surfaceColor }} className="px-2">
                  ou
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => void handleGoogle()}
              disabled={isSubmitting}
              variant="outline"
              className="w-full rounded-full border-2 px-6 py-6 text-lg font-semibold"
              style={{
                borderColor: `${primaryColor}40`,
                backgroundColor: surfaceColor,
                color: textColor,
              }}
            >
              <Chrome className="mr-2 h-5 w-5" />
              Continuer avec Google
            </Button>

            <div className="mt-6 space-y-3 text-center text-sm">
              <Link
                href="/jessica-contentin/forgot-password"
                className="font-medium hover:underline"
                style={{ color: primaryColor }}
              >
                Mot de passe oublié ?
              </Link>
              <p style={{ color: `${textColor}80` }}>
                Pas encore de compte ?{" "}
                <Link href="/jessica-contentin/inscription" className="font-semibold hover:underline" style={{ color: primaryColor }}>
                  Créer un compte
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
