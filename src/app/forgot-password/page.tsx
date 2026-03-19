"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
      if (configuredSiteUrl && configuredSiteUrl !== "https://nevo-app.fr") {
        console.warn("[forgot-password] NEXT_PUBLIC_SITE_URL inattendu:", configuredSiteUrl);
      }
      const redirectTo = "https://nevo-app.fr/reset-password";
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSuccess("Email envoyé. Vérifiez votre boîte de réception.");
    } catch {
      setError("Impossible d'envoyer l'email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-white flex flex-col items-center px-6 py-12">
      <img
        src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
        alt="Nevo"
        className="h-10 mb-10"
      />
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] p-8">
        <h1 className="text-2xl font-semibold mb-2">Mot de passe oublié</h1>
        <p className="text-sm text-white/70 mb-6">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre email"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#5B7CFF]"
            required
          />
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          {success ? <p className="text-xs text-emerald-300">{success}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full px-5 py-3 text-white font-semibold"
            style={{ background: "linear-gradient(135deg, #2536FF, #0EA5E9)" }}
          >
            {isSubmitting ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
      </div>
    </div>
  );
}
