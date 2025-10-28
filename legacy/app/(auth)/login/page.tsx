"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic"; // pas d'ISR ici

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = useMemo(() => {
    const n = search.get("next");
    return n && n.startsWith("/") ? n : "/dashboard";
  }, [search]);

  const supabase = supabaseClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Si déjà connecté, middleware redirigera, mais on double-sécurise côté client.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(next);
    });
  }, [next, router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr(error.message || "Échec de la connexion");
      return;
    }
    router.replace(next);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f17]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur"
      >
        <h1 className="text-white text-2xl font-semibold mb-6">Connexion</h1>

        <label className="block text-sm text-white/70 mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 rounded-lg bg-white/10 text-white px-3 py-2 outline-none focus:ring"
          required
        />

        <label className="block text-sm text-white/70 mb-2">Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 rounded-lg bg-white/10 text-white px-3 py-2 outline-none focus:ring"
          required
        />

        {err && <p className="text-red-400 mb-4 text-sm">{err}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-3 font-medium text-white
                     bg-gradient-to-r from-indigo-500 to-fuchsia-500
                     disabled:opacity-60"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center">Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}
