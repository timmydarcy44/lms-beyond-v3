"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { sbClient } from "@/lib/supabase/client";
import Button from "@/components/cine/Button";

function ForgotForm() {
  const sp = useSearchParams();
  const next = sp.get("next") || "/";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const sb = sbClient();
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/reset?next=${encodeURIComponent(next)}`,
      });
      setMsg(error ? error.message : "E-mail de réinitialisation envoyé.");
    } catch (err) {
      setMsg('Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-bg text-text p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Mot de passe oublié</h1>
        
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
          
          {msg && (
            <div className={`p-3 rounded-lg text-sm ${
              msg.includes('envoyé')
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
            {loading ? "..." : "Envoyer le lien"}
          </Button>
        </form>
        
        <div className="text-center text-sm">
          <a
            href={`/login?next=${encodeURIComponent(next)}`}
            className="text-accent hover:text-accent/80 transition-colors"
          >
            Retour à la connexion
          </a>
        </div>
      </div>
    </main>
  );
}

export default function ForgotPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen grid place-items-center bg-bg text-text p-4">
        <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-surfaceAlt rounded"></div>
            <div className="h-11 bg-surfaceAlt rounded"></div>
            <div className="h-11 bg-surfaceAlt rounded"></div>
          </div>
        </div>
      </main>
    }>
      <ForgotForm />
    </Suspense>
  );
}
