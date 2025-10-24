"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { sbClient } from "@/lib/supabase/client";
import Button from "@/components/cine/Button";

function LoginForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const org = (sp.get("org") || process.env.NEXT_PUBLIC_DEFAULT_ORG || "")
    .toLowerCase()
    .trim();
  const next = sp.get("next") || (org ? `/admin/${org}` : "/org-picker");

  const [mode, setMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loginPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const sb = sbClient();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return setMsg(error.message);
      router.push(next);
    } catch (err) {
      setMsg('Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  }

  async function loginMagic(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const sb = sbClient();
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(
            next
          )}`,
        },
      });
      setMsg(error ? error.message : "Lien envoyé. Vérifie ta boîte mail.");
    } catch (err) {
      setMsg('Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-bg text-text p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Connexion</h1>

        <div className="flex gap-2 text-sm">
          <button
            type="button"
            className={`px-3 py-1 rounded-lg transition-colors ${
              mode === "password" ? "bg-accent text-white" : "bg-bg border border-border text-text hover:bg-surfaceAlt"
            }`}
            onClick={() => setMode("password")}
          >
            Mot de passe
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded-lg transition-colors ${
              mode === "magic" ? "bg-accent text-white" : "bg-bg border border-border text-text hover:bg-surfaceAlt"
            }`}
            onClick={() => setMode("magic")}
          >
            Lien magique
          </button>
        </div>

        <form
          onSubmit={mode === "password" ? loginPassword : loginMagic}
          className="space-y-3"
        >
          <label className="block text-sm">
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full h-11 rounded-lg bg-bg border border-border px-3 outline-none focus:ring-2 focus:ring-accent/70 text-text placeholder:text-muted"
              placeholder="votre@email.com"
            />
          </label>

          {mode === "password" && (
            <>
              <label className="block text-sm">
                Mot de passe
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full h-11 rounded-lg bg-bg border border-border px-3 outline-none focus:ring-2 focus:ring-accent/70 text-text placeholder:text-muted"
                  placeholder="••••••••"
                />
              </label>
              <div className="flex justify-between text-sm">
                <a
                  href={`/signup?org=${org}&next=${encodeURIComponent(next)}`}
                  className="text-accent hover:text-accent/80 transition-colors"
                >
                  Créer un compte
                </a>
                <a
                  href={`/forgot?org=${org}&next=${encodeURIComponent(next)}`}
                  className="text-accent hover:text-accent/80 transition-colors"
                >
                  Mot de passe oublié
                </a>
              </div>
            </>
          )}

          {msg && (
            <div className={`p-3 rounded-lg text-sm ${
              msg.includes('envoyé') || msg.includes('créé') 
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {msg}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            variant="primary"
            className="w-full"
          >
            {loading ? "..." : mode === "password" ? "Se connecter" : "Envoyer le lien"}
          </Button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen grid place-items-center bg-bg text-text p-4">
        <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-surfaceAlt rounded"></div>
            <div className="h-11 bg-surfaceAlt rounded"></div>
            <div className="h-11 bg-surfaceAlt rounded"></div>
            <div className="h-11 bg-surfaceAlt rounded"></div>
          </div>
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
