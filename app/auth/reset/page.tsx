"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { sbClient } from "@/lib/supabase/client";
import Button from "@/components/cine/Button";

function ResetForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const next = sp.get("next") || "/";

  const [password, setPassword] = useState("");
  const [ok, setOk] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const sb = sbClient();
      const { error } = await sb.auth.updateUser({ password });
      if (error) return setMsg(error.message);
      setOk(true);
      setTimeout(() => router.push(next), 700);
    } catch (err) {
      setMsg('Une erreur inattendue s\'est produite');
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-bg text-text p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Nouveau mot de passe</h1>
        
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm">
            Nouveau mot de passe
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
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {msg}
            </div>
          )}
          
          <Button
            type="submit"
            disabled={ok}
            variant="primary"
            className="w-full"
          >
            {ok ? "Mot de passe mis à jour" : "Valider"}
          </Button>
          
          {ok && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
              Mot de passe mis à jour. Redirection…
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

export default function ResetPage() {
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
      <ResetForm />
    </Suspense>
  );
}
