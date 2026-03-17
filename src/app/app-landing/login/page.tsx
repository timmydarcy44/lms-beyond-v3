"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LandingLoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError || !data.session) {
        setError(signInError?.message || "Identifiants incorrects.");
        return;
      }
      router.push("/beyond-note-app?view=library");
    } catch {
      setError("Impossible de se connecter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch {
      setError("Connexion Google indisponible.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-6 py-12">
      <img
        src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
        alt="Nevo"
        className="h-10 mb-10"
      />
      <div className="w-full max-w-md rounded-3xl border border-[#E8E9F0] bg-white shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-[#0F1117] mb-2">Bon retour !</h1>
        <p className="text-sm text-[#6B7280] mb-6">Connecte-toi pour accéder à Nevo.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
            required
          />
        <a
          href="/app-landing/forgot-password"
          className="text-xs text-[#6B7280] hover:text-[#be1354] inline-flex"
        >
          Mot de passe oublié ?
        </a>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full px-5 py-3 text-white font-semibold"
            style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
          >
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-[#E8E9F0]" />
          <span className="text-xs text-[#9CA3AF]">ou</span>
          <div className="h-px flex-1 bg-[#E8E9F0]" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          className="w-full rounded-full border border-[#E8E9F0] px-5 py-3 text-sm font-semibold text-[#0F1117] hover:bg-[#F8F9FC]"
        >
          Continuer avec Google
        </button>

        <p className="text-xs text-[#6B7280] mt-6 text-center">
          Pas encore de compte ?{" "}
          <a href="/app-landing/signup" className="text-[#be1354] font-semibold">
            Créer un compte
          </a>
        </p>
      </div>
    </div>
  );
}
