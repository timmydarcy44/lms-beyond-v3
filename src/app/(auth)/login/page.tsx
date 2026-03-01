"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!supabase) {
      setError("Supabase n'est pas configuré.");
      setIsSubmitting(false);
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.session) {
      setError(signInError?.message || "Identifiants incorrects.");
      setIsSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("disc_status, disc_scores")
      .eq("id", data.user.id)
      .maybeSingle();

    const hasDisc = profile?.disc_status === "completed" || !!profile?.disc_scores;
    router.push(hasDisc ? "/dashboard/profil" : "/onboarding");
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] px-6 py-16 text-white">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div className="flex items-center justify-between">
          <div className="text-[14px] font-semibold tracking-[0.3em] text-white">BEYOND</div>
          <Link href="/register" className="text-[12px] text-white/60 hover:text-white">
            Créer un compte
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
        >
          <h1 className="text-2xl font-semibold">Se connecter</h1>
          <p className="mt-2 text-[13px] text-white/60">
            Accédez à votre profil certifié.
          </p>

          <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="text-[12px] text-white/70">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                placeholder="vous@email.com"
                required
              />
            </label>
            <label className="text-[12px] text-white/70">
              Mot de passe
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#FF6B00]"
                placeholder="••••••••"
                required
              />
            </label>

            {error ? <p className="text-[12px] text-red-400">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 rounded-full bg-[#FF6B00] px-4 py-3 text-[13px] font-semibold text-[#111827] shadow-[0_0_25px_rgba(255,107,0,0.35)] transition hover:shadow-[0_0_40px_rgba(255,107,0,0.6)]"
            >
              {isSubmitting ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
