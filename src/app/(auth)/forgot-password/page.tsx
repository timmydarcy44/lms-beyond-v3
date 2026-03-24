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
    if (!supabase) {
      setError("Supabase n'est pas configuré.");
      setIsSubmitting(false);
      return;
    }
    try {
      const redirectTo = "https://www.nevo-app.fr/reset-password";
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12 text-center">
      <img
        src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
        alt="Nevo"
        className="h-10 mb-6"
      />
      <div className="w-full max-w-md rounded-3xl border border-[#E8E9F0] bg-white shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-[#0F1117] mb-2">Mot de passe oublié</h1>
        <p className="text-sm text-[#6B7280] mb-6">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre email"
            className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#f97316]"
            required
          />
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          {success ? <p className="text-xs text-green-600">{success}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-gradient-to-r from-[#f97316] to-[#ef4444] px-5 py-3 text-white font-semibold"
          >
            {isSubmitting ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
      </div>
    </div>
  );
}
