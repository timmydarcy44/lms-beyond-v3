"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ParticuliersLoginPage() {
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
      if (!supabase) {
        throw new Error("Supabase n'est pas configuré.");
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message === "Email not confirmed") {
          throw new Error(
            "Email non confirmé. Vérifie ta boîte mail et clique sur le lien de confirmation."
          );
        }
        throw new Error(signInError.message);
      }

      if (data?.user?.email) {
        console.log("Login réussi pour:", data.user.email);
      }

      const meta = (data?.user?.user_metadata ?? {}) as Record<string, unknown>;
      const emailPrefix = String(data?.user?.email ?? "").split("@")[0] ?? "";
      const metaFirst =
        String(meta.first_name ?? "").trim() ||
        String(meta.full_name ?? "").trim().split(" ").filter(Boolean)[0] ||
        (emailPrefix ? emailPrefix.split(/[.\-_]/)[0] : "");
      try {
        if (metaFirst) {
          localStorage.setItem("beyond_firstname", metaFirst);
        }
      } catch {
        // ignore
      }

      const response = await fetch("/api/auth/resolve-destination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "connect" }),
      });
      const payload = (await response.json().catch(() => ({}))) as { destination?: string };
      const destination = String(payload.destination ?? "").trim() || "/dashboard/apprenant";
      window.location.href = destination;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-6 py-16 text-black">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="text-[14px] font-semibold tracking-[0.3em] text-black">
            BEYOND
          </div>
          <Link href="/particuliers" className="text-[12px] text-black/60 hover:text-black">
            Retour
          </Link>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Connexion</h1>
          <p className="mt-2 text-[13px] text-black/60">
            Accède à ton profil Beyond.
          </p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="text-[12px] text-black/70">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm text-black outline-none focus:border-[#F97316]"
                placeholder="vous@email.com"
                required
              />
            </label>
            <label className="text-[12px] text-black/70">
              Mot de passe
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm text-black outline-none focus:border-[#F97316]"
                placeholder="••••••••"
                required
              />
            </label>

            {error ? <p className="text-[12px] text-red-500">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-full bg-[#F97316] px-4 py-3 text-[13px] font-semibold text-black shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>

        <div className="text-center text-[12px] text-black/60">
          Pas encore de compte ?{" "}
          <Link href="/particuliers#signup" className="text-black hover:underline">
            Créer mon profil
          </Link>
        </div>
      </div>
    </div>
  );
}
