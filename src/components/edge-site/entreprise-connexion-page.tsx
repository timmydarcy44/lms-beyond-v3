"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Building2, Loader2, Mail } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { EDGE_LOGO_PATH } from "@/lib/edge-site/premium-constants";

const BYOUND_ACCENT = "#3D7BFF";
const BYOUND_PAGE_BG =
  "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(61,123,255,0.18), transparent), #060912";

type Mode = "signup" | "login";

type SignupForm = {
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
};

export function EntrepriseConnexionPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const [mode, setMode] = useState<Mode>("signup");
  const [signupForm, setSignupForm] = useState<SignupForm>({
    first_name: "",
    last_name: "",
    company_name: "",
    email: "",
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<{ email: string; firstName: string } | null>(null);

  const handleSignupChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/entreprises/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupForm),
      });
      const data = (await response.json()) as { error?: string; success?: boolean };

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      setSignupSuccess({ email: signupForm.email, firstName: signupForm.first_name });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (signInError) {
        throw new Error(signInError.message || "Identifiants incorrects.");
      }

      const res = await fetch("/api/auth/resolve-destination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "same-origin",
      });
      const payload = (await res.json().catch(() => ({}))) as { destination?: string };
      router.push(payload.destination ?? "/dashboard/entreprise");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de se connecter.");
    } finally {
      setIsLoading(false);
    }
  };

  if (signupSuccess) {
    const title = signupSuccess.firstName.trim()
      ? `${signupSuccess.firstName.trim()}, vérifiez votre boîte mail`
      : "Vérifiez votre boîte mail";

    return (
      <div
        className="flex min-h-dvh items-center justify-center px-6 text-white"
        style={{ background: BYOUND_PAGE_BG }}
      >
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3D7BFF]/15">
            <Mail className="h-6 w-6 text-[#9EC0FF]" aria-hidden />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7BA7FF]/90">
            Byound Business
          </p>
          <h1 className="mt-3 text-[26px] font-semibold leading-snug tracking-tight">{title}</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/55">
            Un email de confirmation vient de vous être envoyé à{" "}
            <span className="font-medium text-white/85">{signupSuccess.email}</span>. Cliquez sur le lien pour activer
            votre essai gratuit de 30 jours.
          </p>
          <button
            type="button"
            onClick={() => {
              setSignupSuccess(null);
              setMode("login");
            }}
            className="mt-10 w-full rounded-2xl bg-white px-8 py-4 text-[15px] font-semibold text-[#0a0a0a] transition hover:opacity-95"
          >
            Compris
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh text-white" style={{ background: BYOUND_PAGE_BG }}>
      <header className="border-b border-white/[0.08]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/entreprises" className="flex items-center gap-2">
            <Image src={EDGE_LOGO_PATH} alt="Byound" width={112} height={28} className="h-7 w-auto" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Business
            </span>
          </Link>
          <Link href="/entreprises" className="text-[12px] font-medium text-white/50 hover:text-white/80">
            Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_420px] lg:items-start lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3D7BFF]/35 bg-[#3D7BFF]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9EC0FF]">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            Essai 30 jours
          </div>
          <h1 className="mt-6 text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.03em]">
            Pilotez la montée en compétences de vos équipes.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
            Créez votre espace RH Byound : diagnostics DISC & compétences, dashboard temps réel, plan d&apos;action
            personnalisé. Essai gratuit 30 jours, sans carte bancaire.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-white/60">
            <li>· 3 licences RH incluses pendant l&apos;essai</li>
            <li>· Invitations collaborateurs en quelques clics</li>
            <li>· Accès Byound Learn (micro-formations)</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
          <div className="mb-6 flex rounded-full bg-white/[0.06] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMessage(null);
              }}
              className={`flex-1 rounded-full py-2.5 text-[13px] font-semibold transition ${
                mode === "signup" ? "bg-white text-[#0a0a0a]" : "text-white/55 hover:text-white/80"
              }`}
            >
              Créer un compte
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
              }}
              className={`flex-1 rounded-full py-2.5 text-[13px] font-semibold transition ${
                mode === "login" ? "bg-white text-[#0a0a0a]" : "text-white/55 hover:text-white/80"
              }`}
            >
              Se connecter
            </button>
          </div>

          {mode === "signup" ? (
            <form onSubmit={handleSignup} className="space-y-3">
              <input
                type="text"
                name="company_name"
                required
                value={signupForm.company_name}
                onChange={handleSignupChange}
                placeholder="Nom de l'entreprise"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/30 focus:border-white/25"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  name="first_name"
                  required
                  value={signupForm.first_name}
                  onChange={handleSignupChange}
                  placeholder="Prénom"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/30 focus:border-white/25"
                />
                <input
                  type="text"
                  name="last_name"
                  required
                  value={signupForm.last_name}
                  onChange={handleSignupChange}
                  placeholder="Nom"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/30 focus:border-white/25"
                />
              </div>
              <input
                type="email"
                name="email"
                required
                value={signupForm.email}
                onChange={handleSignupChange}
                placeholder="Email professionnel"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/30 focus:border-white/25"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14px] font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: BYOUND_ACCENT }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création en cours…
                  </>
                ) : (
                  <>
                    Démarrer l&apos;essai gratuit
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
              <p className="text-center text-[12px] leading-relaxed text-white/40">
                30 jours gratuits · sans carte bancaire · sans engagement
              </p>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/30 focus:border-white/25"
              />
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[15px] text-white outline-none placeholder:text-white/30 focus:border-white/25"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-[14px] font-semibold text-[#0a0a0a] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Se connecter"}
              </button>
            </form>
          )}

          {errorMessage ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[13px] text-white/85">
              {errorMessage}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
