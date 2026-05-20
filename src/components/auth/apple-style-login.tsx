"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AppleStyleLogin() {
  const router = useRouter();
  const supabase = useSupabase();
  const passwordRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedEmail = email.trim();

  const goToPassword = () => {
    setError(null);
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Saisissez une adresse e-mail valide.");
      return;
    }
    setStep("password");
    requestAnimationFrame(() => passwordRef.current?.focus());
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInError) {
        setError(signInError.message || "Identifiants incorrects.");
        return;
      }

      const res = await fetch("/api/auth/resolve-destination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "same-origin",
      });
      const payload = (await res.json().catch(() => ({}))) as { destination?: string };
      const dest = payload.destination ?? "/dashboard/entreprise";
      router.push(dest);
    } catch {
      setError("Impossible de se connecter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1d1d1f] antialiased">
      <header className="flex h-12 items-center justify-center border-b border-black/[0.06] px-6">
        <span className="text-[13px] font-semibold tracking-tight text-[#1d1d1f]">Beyond LMS</span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-[460px]">
          <h1 className="text-center text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#1d1d1f] sm:text-[40px]">
            Connectez-vous pour ouvrir votre espace de développement
          </h1>

          <p className="mt-10 text-center text-[21px] font-semibold tracking-[-0.01em] text-[#1d1d1f]">
            Connectez-vous
          </p>

          <form
            onSubmit={step === "email" ? (e) => { e.preventDefault(); goToPassword(); } : handleLogin}
            className="mt-6"
          >
            <div className="overflow-hidden rounded-xl border border-[#d2d2d7] bg-white shadow-sm">
              <label className="block">
                <span className="sr-only">Votre adresse e-mail</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse e-mail"
                  className="w-full border-0 bg-transparent px-4 py-[15px] text-[17px] text-[#1d1d1f] outline-none placeholder:text-[#86868b] focus:ring-0"
                  required
                />
              </label>

              {step === "password" ? (
                <>
                  <div className="h-px bg-[#d2d2d7]" aria-hidden />
                  <label className="relative block">
                    <span className="sr-only">Mot de passe</span>
                    <input
                      ref={passwordRef}
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mot de passe"
                      className="w-full border-0 bg-transparent py-[15px] pl-4 pr-14 text-[17px] text-[#1d1d1f] outline-none placeholder:text-[#86868b] focus:ring-0"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      aria-label="Se connecter"
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#0071e3] text-white transition hover:bg-[#0077ed] disabled:opacity-50"
                    >
                      <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                    </button>
                  </label>
                </>
              ) : (
                <div className="flex justify-end border-t border-[#d2d2d7] px-3 py-2">
                  <button
                    type="submit"
                    aria-label="Continuer"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0071e3] text-white transition hover:bg-[#0077ed]"
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>

            {error ? <p className="mt-3 text-center text-[13px] text-[#ff3b30]">{error}</p> : null}

            {step === "password" && isSubmitting ? (
              <p className="mt-3 text-center text-[13px] text-[#86868b]">Connexion…</p>
            ) : null}
          </form>

          <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 text-[14px] text-[#1d1d1f]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-[#d2d2d7] text-[#0071e3] focus:ring-[#0071e3]"
            />
            Se souvenir de moi
          </label>

          <div className="mt-8 space-y-3 text-center text-[14px]">
            <p>
              <Link href="/forgot-password" className="text-[#0066cc] hover:underline">
                Mot de passe oublié ?
              </Link>
            </p>
            <p className="text-[#86868b]">
              Pas encore de compte ?{" "}
              <Link href="/register" className="text-[#0066cc] hover:underline">
                Créer un compte
              </Link>
            </p>
            {step === "password" ? (
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setError(null);
                }}
                className="text-[#0066cc] hover:underline"
              >
                Modifier l&apos;adresse e-mail
              </button>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
