"use client";

import Link from "next/link";
import { useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";

export default function LoginPage() {
  const supabase = useSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message || "Identifiants incorrects.");
        return;
      }
      window.location.href = "/dashboard";
    } catch {
      setError("Impossible de se connecter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030617] text-white">
      <header className="absolute left-8 right-8 top-6 flex items-center justify-between text-sm">
        <span className="font-bold tracking-tight">Beyond LMS</span>
        <Link href="/register" className="text-white hover:opacity-80">
          Créer un compte
        </Link>
      </header>

      <main className="flex min-h-screen w-full items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-extrabold">Se connecter</h1>
          <p className="mt-3 text-sm text-[#94A3B8]">Votre plateforme d&apos;apprentissage</p>

          <form onSubmit={handleLogin} className="mt-10 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Adresse email"
              className="w-full rounded-xl border border-white/10 bg-[#1F2937] px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#f97316]"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mot de passe"
              className="w-full rounded-xl border border-white/10 bg-[#1F2937] px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#f97316]"
              required
            />
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#f97316] to-[#ef4444] px-5 py-3 text-sm font-semibold text-white hover:brightness-110"
            >
              {isSubmitting ? "Connexion..." : "Continuer"}
            </button>
          </form>

        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-sm text-[#94A3B8] hover:text-white">
            Mot de passe oublié ?
          </Link>
        </div>
        </div>
      </main>

      <footer className="absolute bottom-6 left-8 flex items-center gap-6 text-xs text-[#94A3B8]">
        <span>Français</span>
        <a href="/privacy" className="hover:text-white">
          Politique de confidentialité
        </a>
      </footer>
    </div>
  );
}
