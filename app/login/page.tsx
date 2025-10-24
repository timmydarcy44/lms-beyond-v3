"use client";

import { useState, Suspense } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import Button from "@/components/cine/Button";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const sp = useSearchParams();
  const org = sp.get("org") || process.env.NEXT_PUBLIC_DEFAULT_ORG || "";
  const next = sp.get("next") || (org ? `/admin/${org}` : "/org-picker");
  const supabase = createClientComponentClient();
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { 
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` 
      },
    });
    setLoading(false);
    if (!error) setSent(true);
  }

  if (sent) {
    return (
      <main className="min-h-screen grid place-items-center bg-bg text-text p-6">
        <div className="w-[380px] bg-surface p-6 rounded-xl border border-border text-center">
          <h1 className="text-xl font-semibold mb-4">Lien envoyé !</h1>
          <p className="text-muted mb-4">
            Un lien de connexion a été envoyé à <strong>{email}</strong>
          </p>
          <p className="text-sm text-muted">
            Vérifiez votre boîte mail et cliquez sur le lien pour vous connecter.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center bg-bg text-text p-6">
      <form onSubmit={submit} className="w-[380px] space-y-6 bg-surface p-6 rounded-xl border border-border">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Connexion</h1>
          <p className="text-muted">Entrez votre email pour recevoir un lien de connexion</p>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email" 
            required 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            className="w-full h-11 rounded-lg bg-bg border border-border px-3 outline-none focus:ring-2 focus:ring-accent/70 text-text placeholder:text-muted"
            placeholder="votre@email.com"
          />
        </div>
        
        <Button 
          type="submit"
          disabled={loading} 
          loading={loading}
          variant="primary"
          className="w-full"
        >
          {loading ? "Envoi..." : "Recevoir un lien magique"}
        </Button>
        
        {org && (
          <p className="text-xs text-muted text-center">
            Vous serez redirigé vers l'organisation <code className="bg-bg px-1 rounded">{org}</code>
          </p>
        )}
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen grid place-items-center bg-bg text-text p-6">
        <div className="w-[380px] bg-surface p-6 rounded-xl border border-border text-center">
          <div className="animate-pulse">
            <div className="h-6 bg-surfaceAlt rounded mb-4"></div>
            <div className="h-4 bg-surfaceAlt rounded mb-2"></div>
            <div className="h-4 bg-surfaceAlt rounded mb-4"></div>
            <div className="h-11 bg-surfaceAlt rounded"></div>
          </div>
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
