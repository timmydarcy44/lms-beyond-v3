"use client";

import Link from "next/link";
import { useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";

export default function RegisterPage() {
  const supabase = useSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setIsSubmitting(true);
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const emailRedirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent("/dashboard")}`;
      const name =
        displayName.trim() ||
        email
          .trim()
          .split("@")[0] ||
        "Utilisateur";

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo,
          data: {
            display_name: name,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || "Impossible de créer le compte.");
        return;
      }

      const user = data.user;
      if (!user) {
        setInfo("Compte créé. Vérifiez votre boîte mail si une confirmation est requise.");
        return;
      }

      // Session immédiate (confirmation email désactivée dans Supabase) : profil CORE LMS
      if (data.session) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: user.id,
            email: user.email ?? email.trim(),
            role: "learner",
            display_name: name,
          },
          { onConflict: "id" },
        );

        if (profileError) {
          setError(
            `Compte créé, mais profil non enregistré : ${profileError.message}. Vous pourrez compléter votre profil après connexion.`,
          );
          window.location.href = "/dashboard";
          return;
        }

        window.location.href = "/dashboard";
        return;
      }

      setInfo(
        "Compte créé. Un e-mail de confirmation peut être nécessaire : cliquez sur le lien reçu pour activer votre compte, puis connectez-vous.",
      );
    } catch {
      setError("Impossible de créer le compte.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030617] text-white">
      <header className="absolute left-8 right-8 top-6 flex items-center justify-between text-sm">
        <Link href="/login" className="font-bold tracking-tight hover:opacity-80">
          Beyond LMS
        </Link>
        <Link href="/login" className="text-white hover:opacity-80">
          Déjà un compte ? Se connecter
        </Link>
      </header>

      <main className="flex min-h-screen w-full items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-extrabold">Créer un compte</h1>
          <p className="mt-3 text-sm text-[#94A3B8]">Rejoignez la plateforme sur votre projet Supabase.</p>

          <form onSubmit={handleRegister} className="mt-10 space-y-4 text-left">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nom affiché (optionnel)"
              className="w-full rounded-xl border border-white/10 bg-[#1F2937] px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#f97316]"
              autoComplete="name"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse email"
              className="w-full rounded-xl border border-white/10 bg-[#1F2937] px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#f97316]"
              required
              autoComplete="email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe (min. 6 caractères)"
              className="w-full rounded-xl border border-white/10 bg-[#1F2937] px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#f97316]"
              required
              minLength={6}
              autoComplete="new-password"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe"
              className="w-full rounded-xl border border-white/10 bg-[#1F2937] px-4 py-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#f97316]"
              required
              minLength={6}
              autoComplete="new-password"
            />
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
            {info ? <p className="text-xs text-emerald-400">{info}</p> : null}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-[#f97316] to-[#ef4444] px-5 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              {isSubmitting ? "Création…" : "Créer mon compte"}
            </button>
          </form>
        </div>
      </main>

      <footer className="absolute bottom-6 left-8 flex items-center gap-6 text-xs text-[#94A3B8]">
        <span>Français</span>
        <Link href="/privacy" className="hover:text-white">
          Politique de confidentialité
        </Link>
      </footer>
    </div>
  );
}
