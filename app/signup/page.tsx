"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { sbClient } from "@/lib/supabase/client";
import Button from "@/components/cine/Button";

function SignupForm() {
  const sp = useSearchParams();
  const org = (sp.get("org") || "").toLowerCase().trim();
  const next = sp.get("next") || (org ? `/admin/${org}` : "/org-picker");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const sb = sbClient();
      const { error } = await sb.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(
            next
          )}`,
        },
      });
      setMsg(error ? error.message : "Compte créé. Vérifie ton e-mail pour confirmer.");
    } catch (err) {
      setMsg('Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-bg text-text p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Créer un compte</h1>
        
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm">
            E-mail
            <input
              type="email"
              required
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full h-11 rounded-lg bg-bg border border-border px-3 outline-none focus:ring-2 focus:ring-accent/70 text-text placeholder:text-muted"
            />
          </label>
          
          <label className="block text-sm">
            Mot de passe
            <input
              type="password"
              required
              placeholder="•••••••• (min 8 caractères)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full h-11 rounded-lg bg-bg border border-border px-3 outline-none focus:ring-2 focus:ring-accent/70 text-text placeholder:text-muted"
            />
          </label>
          
          {msg && (
            <div className={`p-3 rounded-lg text-sm ${
              msg.includes('créé') || msg.includes('envoyé')
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
            {loading ? "..." : "Créer le compte"}
          </Button>
        </form>
        
        <div className="text-center text-sm">
          <a
            href={`/login?org=${org}&next=${encodeURIComponent(next)}`}
            className="text-accent hover:text-accent/80 transition-colors"
          >
            Déjà un compte ? Se connecter
          </a>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
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
      <SignupForm />
    </Suspense>
  );
}
