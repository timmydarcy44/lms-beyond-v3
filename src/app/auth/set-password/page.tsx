"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { EdgeSetPasswordForm } from "@/components/edge-site/edge-set-password-form";
import { useSupabase } from "@/components/providers/supabase-provider";
import { bootstrapSessionFromUrl } from "@/lib/auth/bootstrap-session-from-url";
import { COLLABORATOR_DASHBOARD_PATH } from "@/lib/entreprise/collaborator-invite";
import { toast } from "sonner";

function requirementMet(password: string, re: RegExp) {
  return re.test(password);
}

function SetPasswordForm() {
  const searchParams = useSearchParams();
  const supabase = useSupabase();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bootState, setBootState] = useState<"loading" | "ready" | "error">("loading");

  const flow = searchParams.get("flow");
  const nextPath = searchParams.get("next") || (flow === "invite" ? COLLABORATOR_DASHBOARD_PATH : "/dashboard/apprenant");
  const isEdgeParticulier = flow === "particulier";
  const isEdgeEntreprise = flow === "entreprise";
  const isInviteFlow = flow === "invite";
  const isEdgeMarketingFlow = isEdgeParticulier || isEdgeEntreprise || isInviteFlow;
  const authQueryKey = searchParams.toString();

  useEffect(() => {
    let cancelled = false;
    const failTimer = window.setTimeout(() => {
      if (!cancelled) {
        setBootState((current) => (current === "loading" ? "error" : current));
      }
    }, 10000);

    async function bootstrapSession() {
      try {
        const code = searchParams.get("code");
        const { session, error } = await bootstrapSessionFromUrl(supabase, code);

        if (cancelled) return;

        if (session) {
          setBootState("ready");
          return;
        }

        setBootState("error");
        if (error) console.error("[set-password] session bootstrap:", error);
        toast.error(
          isEdgeEntreprise
            ? "Lien expiré ou invalide. Réinscrivez-vous sur la page entreprise EDGE pour recevoir un nouvel email."
            : isEdgeParticulier
              ? "Lien expiré ou invalide. Réinscrivez-vous sur la page EDGE pour recevoir un nouvel email."
              : isInviteFlow
                ? "Lien expiré ou invalide. Demandez une nouvelle invitation à votre responsable RH."
                : "Lien invalide ou expiré. Demandez une nouvelle invitation.",
        );
      } catch (error) {
        if (!cancelled) {
          console.error("[set-password] bootstrap error:", error);
          setBootState("error");
        }
      } finally {
        window.clearTimeout(failTimer);
      }
    }

    void bootstrapSession();
    return () => {
      cancelled = true;
      window.clearTimeout(failTimer);
    };
  }, [supabase, authQueryKey, isEdgeParticulier, isEdgeEntreprise, isInviteFlow]);

  const ensureActiveSession = async () => {
    const code = searchParams.get("code");
    const boot = await bootstrapSessionFromUrl(supabase, code);
    if (boot.session) return boot.session;
    const { data } = await supabase.auth.getSession();
    return data.session;
  };

  const completePasswordSetup = async (pwd: string): Promise<{ ok: true; destination: string } | { ok: false; message: string }> => {
    const session = await ensureActiveSession();
    if (session) {
      const { error } = await supabase.auth.updateUser({
        password: pwd,
        data: { needs_password_setup: false },
      });
      if (!error) {
        const destination = isInviteFlow ? COLLABORATOR_DASHBOARD_PATH : nextPath;
        return { ok: true, destination };
      }
      if (!/session|jwt|token|auth/i.test(error.message)) {
        return { ok: false, message: error.message };
      }
    }

    const res = await fetch("/api/auth/complete-password-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pwd }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; destination?: string };
    if (!res.ok) {
      return { ok: false, message: data.error ?? "Impossible de créer le mot de passe." };
    }
    return { ok: true, destination: data.destination ?? (isInviteFlow ? COLLABORATOR_DASHBOARD_PATH : nextPath) };
  };

  const rules = useMemo(
    () => [
      { label: "Entre 8 et 99 caractères", ok: password.length >= 8 && password.length <= 99 },
      { label: "Au moins 1 minuscule", ok: requirementMet(password, /[a-z]/) },
      { label: "Au moins 1 majuscule", ok: requirementMet(password, /[A-Z]/) },
      { label: "Au moins 1 chiffre", ok: requirementMet(password, /\d/) },
      { label: "Au moins 1 caractère spécial (#?!@$%^&*-)", ok: requirementMet(password, /[#?!@$%^&*-]/) },
    ],
    [password],
  );

  const allRulesOk = rules.every((r) => r.ok);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRulesOk) {
      toast.error("Le mot de passe ne respecte pas toutes les exigences.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setSubmitError(null);
    setIsLoading(true);
    try {
      const result = await completePasswordSetup(password);
      if (!result.ok) {
        setSubmitError(result.message);
        toast.error(result.message);
        return;
      }
      toast.success(
        isEdgeEntreprise
          ? "Mot de passe créé. Bienvenue sur votre espace entreprise EDGE !"
          : isEdgeParticulier
            ? "Mot de passe créé. Bienvenue sur EDGE !"
            : isInviteFlow
              ? "Mot de passe créé. Bienvenue sur votre espace collaborateur !"
              : "Mot de passe créé. Bienvenue sur Beyond !",
      );
      window.location.assign(result.destination);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdgeSubmit = async (pwd: string) => {
    setSubmitError(null);
    setIsLoading(true);
    try {
      const result = await completePasswordSetup(pwd);
      if (!result.ok) {
        setSubmitError(result.message);
        toast.error(result.message);
        return;
      }
      toast.success(
        isEdgeEntreprise
          ? "Bienvenue — votre espace entreprise EDGE est prêt."
          : isInviteFlow
            ? "Bienvenue — votre espace collaborateur est prêt."
            : "Bienvenue sur EDGE — votre cockpit est prêt.",
      );
      window.location.assign(result.destination);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (bootState === "loading" && isEdgeMarketingFlow) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    );
  }

  if (bootState === "loading") {
    return (
      <div className={`flex min-h-screen items-center justify-center ${isEdgeMarketingFlow ? "bg-[#f5f5f5]" : "bg-white"}`}>
        <Loader2 className={`h-8 w-8 animate-spin ${isEdgeMarketingFlow ? "text-edge-black" : "text-violet-600"}`} />
      </div>
    );
  }

  if (bootState === "error" && isEdgeMarketingFlow) {
    const retryHref = isEdgeEntreprise ? "/entreprises/connexion" : "/particuliers#signup";
    const retryLabel = isEdgeEntreprise ? "Réinscription entreprise" : "Réinscription EDGE";
    return (
      <div
        className="flex min-h-dvh items-center justify-center px-6 text-white"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, rgba(255,59,48,0.45) 0%, transparent 55%), linear-gradient(180deg, #160706 0%, #0a0a0a 100%)",
        }}
      >
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Lien expiré</h1>
          <p className="mt-3 text-sm text-white/55">
            Ce lien n&apos;est plus valable. Réinscrivez-vous pour recevoir un nouvel email.
          </p>
          <a
            href={retryHref}
            className="mt-8 inline-flex rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-[#0a0a0a]"
          >
            {retryLabel}
          </a>
        </div>
      </div>
    );
  }

  if (bootState === "error") {
    return (
      <div className={`flex min-h-screen items-center justify-center px-6 ${isEdgeMarketingFlow ? "bg-[#f5f5f5]" : "bg-white"}`}>
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-gray-950">Lien expiré ou invalide</h1>
          <p className="mt-3 text-sm text-gray-600">
            {isEdgeMarketingFlow
              ? "Ce lien de confirmation n'est plus valable. Réinscrivez-vous pour recevoir un nouvel email."
              : "Ce lien d'invitation n'est plus valable. Demandez une nouvelle invitation à votre administrateur."}
          </p>
          {isEdgeMarketingFlow ? (
            <a
              href={isEdgeEntreprise ? "/entreprises/connexion" : "/particuliers#signup"}
              className="mt-6 inline-flex rounded-full bg-edge-black px-6 py-3 text-sm font-medium text-white"
            >
              {isEdgeEntreprise ? "Réinscription entreprise" : "Réinscription EDGE"}
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  if (isEdgeMarketingFlow) {
    return (
      <EdgeSetPasswordForm
        variant={isEdgeEntreprise ? "entreprise" : isInviteFlow ? "salarie" : "particulier"}
        isLoading={isLoading}
        errorMessage={submitError}
        onSubmit={(pwd) => void handleEdgeSubmit(pwd)}
      />
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-[#0f0e1a] via-[#1a1535] to-[#2d1b69] p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">Beyond</p>
        <h1 className="mt-6 text-4xl font-black tracking-tight">Bienvenue dans votre espace</h1>
        <p className="mt-4 max-w-md text-white/70">
          Créez votre mot de passe pour accéder à votre dashboard apprenant, passer vos tests et suivre vos missions.
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-950">Créez votre mot de passe</h2>
          <p className="mt-2 text-sm text-gray-600">Confirmez votre compte Beyond pour continuer.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-800">
                Nouveau mot de passe
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-gray-900"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  aria-label="Afficher le mot de passe"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <ul className="space-y-1.5 rounded-xl bg-gray-50 p-4 text-sm">
              <li className="font-medium text-gray-700">Exigences du mot de passe :</li>
              {rules.map((rule) => (
                <li key={rule.label} className={rule.ok ? "text-emerald-700" : "text-gray-500"}>
                  {rule.ok ? "✓" : "○"} {rule.label}
                </li>
              ))}
            </ul>

            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-800">
                Confirmez le mot de passe
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !allRulesOk}
              className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
            >
              {isLoading ? "Création…" : "Confirmer et accéder à mon espace"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CollaboratorSetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
