"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { toast } from "sonner";

function requirementMet(password: string, re: RegExp) {
  return re.test(password);
}

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const nextPath = searchParams.get("next") || "/dashboard/apprenant";

  useEffect(() => {
    let cancelled = false;
    async function bootstrapSession() {
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.includes("access_token")) {
        const hashParams = new URLSearchParams(hash.replace(/^#/, ""));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled) setReady(Boolean(session));
      if (!session && !cancelled) {
        toast.error("Lien invalide ou expiré. Demandez une nouvelle invitation.");
      }
    }
    void bootstrapSession();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

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

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Mot de passe créé. Bienvenue sur Beyond !");
      router.replace(nextPath);
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
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
