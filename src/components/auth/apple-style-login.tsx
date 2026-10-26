"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AppleStyleLogin() {
  const router = useRouter();
  const supabase = useSupabase();
  const passwordRef = useRef<HTMLInputElement>(null);

  const [audience, setAudience] = useState<"default" | "professionnel">("default");
  const [method, setMethod] = useState<"password" | "code">("password");
  const [step, setStep] = useState<"email" | "password" | "code">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [digits, setDigits] = useState<string[]>([]);
  const [resendIn, setResendIn] = useState(0);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const codeInputs = useRef<Array<HTMLInputElement | null>>([]);

  const trimmedEmail = email.trim();
  const professionnel = audience === "professionnel";

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const goToPassword = () => {
    setError(null);
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Saisissez une adresse e-mail valide.");
      return;
    }
    setStep("password");
    requestAnimationFrame(() => passwordRef.current?.focus());
  };

  const sendCode = async () => {
    setError(null);
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Saisissez une adresse e-mail valide.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/entreprises/send-login-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail.toLowerCase() }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; digits?: number; retryAfter?: number };
      if (!response.ok) {
        setError(data.error || "Le code n'a pas pu être envoyé.");
        if (data.retryAfter) setResendIn(data.retryAfter);
        return;
      }
      const length = Math.min(10, Math.max(6, Number(data.digits) || 8));
      setDigits(Array.from({ length }, () => ""));
      setStep("code");
      setResendIn(60);
      window.setTimeout(() => codeInputs.current[0]?.focus(), 50);
    } catch {
      setError("Le code n'a pas pu être envoyé.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async (token: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/entreprises/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail.toLowerCase(), token }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; destination?: string };
      if (!response.ok || !data.destination) {
        setError(data.error || "Code incorrect ou expiré.");
        return;
      }
      router.push(`/auth/hello?next=${encodeURIComponent(data.destination)}`);
    } catch {
      setError("Code incorrect ou expiré.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDigit = (index: number, value: string) => {
    const chars = value.replace(/\D/g, "");
    const next = [...digits];
    if (!chars) {
      next[index] = "";
      setDigits(next);
      return;
    }
    chars.split("").forEach((char, offset) => {
      if (index + offset < next.length) next[index + offset] = char;
    });
    setDigits(next);
    const focus = Math.min(index + chars.length, next.length - 1);
    codeInputs.current[focus]?.focus();
    if (next.every(Boolean)) void verifyCode(next.join(""));
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
      router.push(`/auth/hello?next=${encodeURIComponent(dest)}`);
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

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              aria-pressed={professionnel}
              onClick={() => {
                setAudience(professionnel ? "default" : "professionnel");
                setMethod("password");
                setStep("email");
                setDigits([]);
                setError(null);
              }}
              className={`h-10 rounded-full px-4 text-[14px] font-semibold ${professionnel ? "bg-[#1d1d1f] text-white" : "bg-[#f5f5f7] text-[#1d1d1f]"}`}
            >
              Professionnel
            </button>
          </div>
          {professionnel ? (
            <div className="mt-4 flex justify-center gap-2" role="radiogroup" aria-label="Mode de connexion">
              {(
                [
                  ["password", "Mot de passe"],
                  ["code", "Code"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={method === id}
                  onClick={() => {
                    setMethod(id);
                    setStep("email");
                    setError(null);
                  }}
                  className={`h-9 rounded-full px-4 text-[14px] ${method === id ? "bg-[#0071e3] text-white" : "text-[#0066cc]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}

          <form
            onSubmit={
              step === "code"
                ? (event) => {
                    event.preventDefault();
                    void verifyCode(digits.join(""));
                  }
                : step === "email"
                  ? (event) => {
                      event.preventDefault();
                      if (professionnel && method === "code") void sendCode();
                      else goToPassword();
                    }
                  : handleLogin
            }
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

              {step === "code" ? (
                <>
                  <div className="h-px bg-[#d2d2d7]" aria-hidden />
                  <div className="flex justify-center gap-2 px-3 py-3">
                    {digits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(node) => {
                          codeInputs.current[index] = node;
                        }}
                        inputMode="numeric"
                        autoComplete={index === 0 ? "one-time-code" : "off"}
                        aria-label={`Chiffre ${index + 1}`}
                        value={digit}
                        onChange={(event) => onDigit(index, event.target.value)}
                        className="h-11 w-9 rounded-lg border border-[#d2d2d7] text-center text-[17px] outline-none focus:border-[#0071e3]"
                      />
                    ))}
                  </div>
                </>
              ) : step === "password" ? (
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
                    aria-label={professionnel && method === "code" ? "Recevoir un code" : "Continuer"}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0071e3] text-white transition hover:bg-[#0077ed]"
                  >
                    <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </div>

            {error ? <p className="mt-3 text-center text-[13px] text-[#ff3b30]">{error}</p> : null}

            {isSubmitting ? <p className="mt-3 text-center text-[13px] text-[#86868b]">Connexion…</p> : null}
            {step === "code" ? (
              <button
                type="button"
                disabled={resendIn > 0 || isSubmitting}
                onClick={() => void sendCode()}
                className="mt-4 w-full text-center text-[14px] text-[#0066cc] hover:underline disabled:text-[#86868b] disabled:no-underline"
              >
                {resendIn > 0 ? `Renvoyer le code dans ${resendIn} s` : "Renvoyer le code"}
              </button>
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
            {step !== "email" ? (
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
