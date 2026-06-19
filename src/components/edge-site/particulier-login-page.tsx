"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";

export function ParticulierLoginPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw new Error(signInError.message || "Identifiants incorrects.");
      }

      const res = await fetch("/api/auth/resolve-destination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "same-origin",
      });
      const payload = (await res.json().catch(() => ({}))) as { destination?: string };
      router.push(payload.destination ?? "/dashboard/apprenant");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de se connecter.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-edge-black antialiased">
      <header className="border-b border-black/[0.06]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/particuliers" className="text-[15px] font-semibold tracking-[-0.02em] text-edge-black">
            EDGE
          </Link>
          <Link href="/particuliers#signup" className="text-[12px] font-medium text-black/50 hover:text-edge-black">
            Créer un compte
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col justify-center px-5 py-16 sm:px-8 sm:py-24">
        <h1 className="text-[clamp(1.75rem,4vw,2.25rem)] font-medium tracking-[-0.02em]">Connexion</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-black/45">
          Accédez à votre espace compétences EDGE avec l&apos;email et le mot de passe choisis lors de votre inscription.
        </p>

        <form onSubmit={handleLogin} className="mt-10 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-edge-black/30"
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            autoComplete="current-password"
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-edge-black/30"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-edge-black px-6 py-3.5 text-[13px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connexion…
              </>
            ) : (
              <>
                Se connecter
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>
        </form>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-[13px] text-edge-black">
            {errorMessage}
          </div>
        ) : null}

        <p className="mt-8 text-center text-[13px] text-black/45">
          Pas encore de compte ?{" "}
          <Link href="/particuliers#signup" className="font-medium text-edge-black underline-offset-2 hover:underline">
            Créer mon espace gratuitement
          </Link>
        </p>
        <p className="mt-3 text-center text-[12px] text-black/35">
          Lien de confirmation expiré ?{" "}
          <Link href="/particuliers#signup" className="underline-offset-2 hover:underline">
            Réinscrivez-vous
          </Link>{" "}
          ou demandez un nouveau lien depuis la page d&apos;inscription.
        </p>
      </main>
    </div>
  );
}
