"use client";

import { Manrope } from "next/font/google";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { EntrepriseCodeScreen } from "@/components/edge-site/entreprise-code-screen";
import { useSupabase } from "@/components/providers/supabase-provider";
import {
  CONSUMER_EMAIL_WARNING,
  entrepriseSignupSchema,
  isConsumerEmail,
  signupFieldErrors,
  suggestProfessionalEmail,
  type SignupField,
} from "@/lib/entreprise/signup-fields";

const manrope = Manrope({
  subsets: ["latin"],
});

const PLAN_LABELS: Record<string, string> = {
  skills: "Byound Skills",
  learning: "Byound Learning",
  "learning-plus": "Byound Learning+",
};

type Mode = "signup" | "login";

function badgePageReturn(value: string | null) {
  if (!value || !/^\/badges\/[0-9a-f-]{36}$/i.test(value)) return null;
  return value;
}

type SignupForm = {
  company_name: string;
  siret: string;
  first_name: string;
  last_name: string;
  email: string;
};

const EMPTY_FORM: SignupForm = {
  company_name: "",
  siret: "",
  first_name: "",
  last_name: "",
  email: "",
};

export function EntrepriseConnexionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();
  const planLabel = PLAN_LABELS[searchParams.get("plan") ?? ""] ?? null;
  const seats = searchParams.get("seats");
  const returnTo = badgePageReturn(searchParams.get("next"));
  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "login" ? "login" : "signup");
  const [form, setForm] = useState<SignupForm>(EMPTY_FORM);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<SignupField, string>>>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "code" | "password">("form");
  const [codeEmail, setCodeEmail] = useState("");
  const [codeLength, setCodeLength] = useState(8);

  const suggestion = suggestProfessionalEmail(form.email);
  const consumerWarning = !suggestion && isConsumerEmail(form.email) ? CONSUMER_EMAIL_WARNING : null;
  const companyLabel = form.company_name.trim() || "Votre entreprise";

  const openCode = (email: string, digits?: number) => {
    setCodeEmail(email);
    if (digits && digits >= 6) setCodeLength(digits);
    setStep("code");
  };

  const setField = (name: SignupField, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = entrepriseSignupSchema.safeParse(form);
    if (!parsed.success) {
      setFieldErrors(signupFieldErrors(parsed.error));
      return;
    }
    setIsLoading(true);
    setFieldErrors({});
    try {
      const response = await fetch("/api/entreprises/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json()) as {
        error?: string;
        fields?: Partial<Record<SignupField, string>>;
        step?: string;
        digits?: number;
      };
      if (!response.ok) {
        setFieldErrors(data.fields ?? { email: data.error || "Une erreur est survenue." });
        return;
      }
      if (data.step === "password") {
        setLoginEmail(parsed.data.email);
        setMode("login");
        setStep("password");
        return;
      }
      openCode(parsed.data.email, data.digits);
    } catch {
      setFieldErrors({ email: "Une erreur est survenue." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginStart = async (event: React.FormEvent) => {
    event.preventDefault();
    const email = loginEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      setLoginError("Cette adresse email n'est pas valide.");
      return;
    }
    setIsLoading(true);
    setLoginError(null);
    try {
      const response = await fetch("/api/entreprises/login-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; step?: string; digits?: number };
      if (!response.ok) {
        setLoginError(data.error || "Impossible de continuer.");
        return;
      }
      if (data.step === "password") {
        setStep("password");
        return;
      }
      openCode(email, data.digits);
    } catch {
      setLoginError("Impossible de continuer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setLoginError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });
      if (signInError) throw new Error(signInError.message || "Identifiants incorrects.");
      const res = await fetch("/api/auth/resolve-destination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "same-origin",
      });
      const payload = (await res.json().catch(() => ({}))) as { destination?: string };
      router.push(returnTo ?? payload.destination ?? "/dashboard/entreprise");
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Impossible de se connecter.");
    } finally {
      setIsLoading(false);
    }
  };

  const leaveCode = () => {
    setStep("form");
    if (mode === "login") setLoginEmail(codeEmail);
    else setField("email", codeEmail);
  };

  return (
    <div className={`${manrope.className} min-h-dvh bg-[#F4F4F1] text-[#07080B] lg:grid lg:grid-cols-[1.05fr_1fr]`}>
      <aside
        className="relative hidden min-h-dvh flex-col justify-between px-14 py-10 text-white lg:flex"
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 18% 88%, #6E5BFF59, transparent 62%), #070C1C",
        }}
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[13px] font-extrabold text-[#07080B]">
              BY
            </span>
            <span className="text-[15px] font-extrabold">Byound Business</span>
          </div>
          <p className="mt-10 inline-flex rounded-full bg-[#6E5BFF] px-3 py-1.5 text-[13px] font-extrabold text-white">
            Essai gratuit de 30 jours
          </p>
          <h1 className="mt-6 max-w-[560px] text-[54px] font-extrabold leading-[1.02] tracking-[-2px]">
            Pilotez la montée en compétences de vos équipes.
          </h1>
          <p className="mt-5 max-w-[460px] text-[16px] leading-relaxed text-[#B5BAC6]">
            Diagnostics, formations et invitations de vos collaborateurs, dans un seul espace. Sans carte bancaire.
          </p>
        </div>
        <div className="flex items-end gap-8 pb-4">
          <div
            className="relative h-[210px] w-[340px] shrink-0 overflow-hidden rounded-[26px] p-6 text-white shadow-[0_30px_60px_#00000066]"
            style={{
              background: "linear-gradient(135deg, #8B7BFF, #6E5BFF 55%, #4B3BD1)",
              transform: "rotate(-4deg)",
            }}
          >
            <span className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/15" aria-hidden />
            <div className="flex items-start justify-between">
              <p className="text-[14px] font-extrabold">Espace RH</p>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[12px] font-extrabold">30 jours</span>
            </div>
            <p className="mt-14 truncate text-[28px] font-extrabold tracking-[-0.6px]">{companyLabel}</p>
            <p className="mt-1 text-[13px] text-white/80">3 licences RH · collaborateurs illimités</p>
          </div>
          <ul className="mb-6 space-y-3 text-[14px] font-semibold">
            {["3 licences RH incluses", "Invitations en quelques clics", "Accès à Byound Online"].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFFFFF1A]" aria-hidden>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6.2 4.8 8.5 9.5 3.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex min-h-dvh flex-col px-5 py-6 sm:px-8">
        <div className="mb-8 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#07080B] text-[12px] font-extrabold text-white">
              BY
            </span>
            <span className="text-[14px] font-extrabold">Byound Business</span>
          </div>
          <span className="rounded-full bg-[#EEEBFF] px-3 py-1 text-[12px] font-extrabold text-[#4B3BD1]">
            Essai gratuit de 30 jours
          </span>
        </div>

        <div className={`mx-auto flex w-full flex-1 flex-col justify-center ${step === "code" ? "max-w-[520px]" : "max-w-[440px]"}`}>
          {step === "code" && codeEmail ? (
            <EntrepriseCodeScreen email={codeEmail} length={codeLength} onBack={leaveCode} returnTo={returnTo} />
          ) : (
          <>
          <div className="flex rounded-full bg-white p-1" role="radiogroup" aria-label="Créer un compte ou se connecter">
            {(
              [
                ["signup", "Créer un compte"],
                ["login", "Se connecter"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={mode === id}
                onClick={() => {
                  setMode(id);
                  setStep("form");
                  setFieldErrors({});
                  setLoginError(null);
                }}
                className={`h-11 flex-1 rounded-full text-[14px] font-extrabold ${
                  mode === id ? "bg-[#07080B] text-white" : "text-[#6B6F7A]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "signup" ? (
            <form onSubmit={handleSignup} className="mt-8" noValidate>
              <h2 className="text-[30px] font-extrabold tracking-[-0.8px]">Créez votre espace</h2>
              <p className="mt-2 text-[15px] text-[#6B6F7A]">Moins d&apos;une minute. Vous recevrez un code par email.</p>
              {planLabel ? (
                <p className="mt-3 text-[13px] font-extrabold text-[#4B3BD1]">
                  Offre choisie : {planLabel}
                  {seats ? ` · ${seats} collaborateurs` : ""}
                </p>
              ) : null}

              <div className="mt-8 space-y-4">
                <Field
                  label="Votre entreprise"
                  name="company_name"
                  value={form.company_name}
                  error={fieldErrors.company_name}
                  onChange={setField}
                  autoComplete="organization"
                />
                <Field
                  label="SIRET (facultatif)"
                  name="siret"
                  value={form.siret}
                  error={fieldErrors.siret}
                  onChange={setField}
                  inputMode="numeric"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Prénom"
                    name="first_name"
                    value={form.first_name}
                    error={fieldErrors.first_name}
                    onChange={setField}
                    autoComplete="given-name"
                  />
                  <Field
                    label="Nom"
                    name="last_name"
                    value={form.last_name}
                    error={fieldErrors.last_name}
                    onChange={setField}
                    autoComplete="family-name"
                  />
                </div>
                <Field
                  label="Email professionnel"
                  name="email"
                  type="email"
                  value={form.email}
                  error={suggestion ? "Cette adresse semble contenir une faute de frappe." : fieldErrors.email}
                  onChange={setField}
                  autoComplete="email"
                  inputMode="email"
                />
                {suggestion ? (
                  <p role="alert" className="-mt-2 text-[13px] font-semibold text-[#B42318]">
                    Vous vouliez dire{" "}
                    <button
                      type="button"
                      className="font-extrabold underline"
                      onClick={() => setField("email", suggestion)}
                    >
                      {suggestion}
                    </button>{" "}
                    ?
                  </p>
                ) : null}
                {consumerWarning ? <p className="-mt-2 text-[13px] text-[#6B6F7A]">{consumerWarning}</p> : null}
                {!suggestion && fieldErrors.email ? (
                  <p role="alert" className="-mt-2 text-[13px] font-semibold text-[#B42318]">
                    {fieldErrors.email}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-6 h-14 w-full rounded-full bg-[#6E5BFF] text-[16px] font-extrabold text-white disabled:opacity-60"
              >
                {isLoading ? "Création en cours…" : "Démarrer l'essai gratuit"}
              </button>

              <p className="mt-5 text-center text-[12px] leading-relaxed text-[#6B6F7A]">
                30 jours gratuits · sans carte bancaire · sans engagement. En créant un compte, vous acceptez les{" "}
                <a href="#" className="font-extrabold text-[#4B3BD1] underline">
                  conditions
                </a>{" "}
                et la{" "}
                <a href="#" className="font-extrabold text-[#4B3BD1] underline">
                  politique de confidentialité
                </a>
                .
              </p>
            </form>
          ) : (
            <form onSubmit={step === "password" ? handleLogin : handleLoginStart} className="mt-8" noValidate>
              <h2 className="text-[30px] font-extrabold tracking-[-0.8px]">Se connecter</h2>
              <p className="mt-2 text-[15px] text-[#6B6F7A]">Retrouvez votre espace Byound Business.</p>
              <div className="mt-8 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[13px] font-extrabold">Email</span>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    autoComplete="email"
                    onChange={(event) => setLoginEmail(event.target.value)}
                    className="h-14 w-full rounded-[18px] border border-[#E3E0D8] bg-white px-4 text-[16px] outline-none focus:ring-2 focus:ring-[#6E5BFF]"
                  />
                </label>
                {step === "password" ? (
                  <label className="block">
                    <span className="mb-2 block text-[13px] font-extrabold">Mot de passe</span>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      autoComplete="current-password"
                      onChange={(event) => setLoginPassword(event.target.value)}
                      className="h-14 w-full rounded-[18px] border border-[#E3E0D8] bg-white px-4 text-[16px] outline-none focus:ring-2 focus:ring-[#6E5BFF]"
                    />
                  </label>
                ) : null}
              </div>
              {loginError ? (
                <p role="alert" className="mt-3 text-[13px] font-semibold text-[#B42318]">
                  {loginError}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={isLoading}
                className="mt-6 h-14 w-full rounded-full bg-[#6E5BFF] text-[16px] font-extrabold text-white disabled:opacity-60"
              >
                {isLoading ? "Connexion…" : step === "password" ? "Se connecter" : "Continuer"}
              </button>
              {step === "password" ? (
                <button
                  type="button"
                  className="mt-4 w-full text-center text-[14px] font-extrabold text-[#4B3BD1]"
                  onClick={() => {
                    const email = loginEmail.trim().toLowerCase();
                    if (!email.includes("@")) {
                      setLoginError("Cette adresse email n'est pas valide.");
                      return;
                    }
                    setIsLoading(true);
                    void fetch("/api/entreprises/send-login-code", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email }),
                    })
                      .then(async (response) => {
                        const data = (await response.json().catch(() => ({}))) as { error?: string; digits?: number };
                        if (!response.ok) {
                          setLoginError(data.error || "Le code n'a pas pu être envoyé.");
                          return;
                        }
                        openCode(email, data.digits);
                      })
                      .finally(() => setIsLoading(false));
                  }}
                >
                  Recevoir un code à la place
                </button>
              ) : null}
            </form>
          )}
          </>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  error,
  onChange,
  type = "text",
  autoComplete,
  inputMode,
}: {
  label: string;
  name: SignupField;
  value: string;
  error?: string;
  onChange: (name: SignupField, value: string) => void;
  type?: string;
  autoComplete?: string;
  inputMode?: "email" | "text" | "numeric";
}) {
  const describedBy = error ? `${name}-error` : undefined;
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-extrabold">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        onChange={(event) => onChange(name, event.target.value)}
        className={`h-14 w-full rounded-[18px] bg-white px-4 text-[16px] outline-none focus:ring-2 focus:ring-[#6E5BFF] ${
          error ? "border-[1.5px] border-[#D6334A]" : "border border-[#E3E0D8]"
        }`}
      />
      {error && name !== "email" ? (
        <span id={describedBy} role="alert" className="mt-1.5 block text-[13px] font-semibold text-[#B42318]">
          {error}
        </span>
      ) : null}
    </label>
  );
}
