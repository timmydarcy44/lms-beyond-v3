"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { EDGE_GRADIENTS } from "@/lib/edge/edge-brand";

function scorePassword(value: string): number {
  let score = 0;
  if (value.length >= 8) score++;
  if (/[a-z]/.test(value)) score++;
  if (/[A-Z]/.test(value)) score++;
  if (/[0-9]/.test(value)) score++;
  if (/[#?!@$%^&*-]/.test(value)) score++;
  return score;
}

type EdgeSetPasswordFormProps = {
  isLoading: boolean;
  onSubmit: (password: string) => void;
  variant?: "particulier" | "entreprise" | "salarie";
  errorMessage?: string | null;
};

export function EdgeSetPasswordForm({
  isLoading,
  onSubmit,
  variant = "particulier",
  errorMessage,
}: EdgeSetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<"pwd" | "pwd2" | null>(null);

  const strength = useMemo(() => {
    const score = scorePassword(password);
    const pct = (score / 5) * 100;
    if (password.length === 0) {
      return { pct: 0, label: "Robustesse", color: "rgba(255,255,255,0.32)", bar: "rgba(255,255,255,0.3)" };
    }
    if (score <= 2) {
      return { pct, label: "Trop simple", color: "#FF3B30", bar: "#FF3B30" };
    }
    if (score <= 4) {
      return { pct, label: "Correct", color: "#FF9F0A", bar: "#FF9F0A" };
    }
    return { pct, label: "Robuste", color: "#34C759", bar: "#34C759" };
  }, [password]);

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = scorePassword(password) >= 4 && passwordsMatch && !isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(password);
  };

  return (
    <div
      className="flex min-h-dvh w-full items-center justify-center px-4"
      style={{ background: EDGE_GRADIENTS.passwordBg }}
    >
      <div className="relative flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden text-white">
      <div className="h-[54px] shrink-0" aria-hidden />

      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-[360px] flex-1 flex-col px-6 pb-7 pt-2">
        <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
          {variant === "entreprise"
            ? "EDGE · Espace entreprise"
            : variant === "salarie"
              ? "EDGE · Espace collaborateur"
              : "EDGE · Espace compétences"}
        </p>
        <h1 className="text-[30px] font-bold leading-[1.15] tracking-[-0.01em]">Dernière étape</h1>
        <p className="mb-9 mt-2 max-w-[320px] text-[14.5px] leading-relaxed text-white/55">
          {variant === "entreprise"
            ? "Votre dashboard RH Beyond et vos diagnostics équipe vous attendent."
            : variant === "salarie"
              ? "Votre espace salarié, vos tests IDMC et soft skills vous attendent."
              : "Votre cockpit DISC, IDMC et soft skills vous attend."}
        </p>

        <div className="mb-[18px]">
          <div
            className={`relative rounded-2xl border px-[18px] py-3.5 backdrop-blur-sm transition-all duration-250 ${
              focusedField === "pwd"
                ? "border-[rgba(61,123,255,0.55)] bg-white/10 shadow-[0_0_0_4px_rgba(61,123,255,0.12)]"
                : "border-white/[0.08] bg-white/[0.06]"
            }`}
          >
            <label htmlFor="edge-pwd" className="mb-1 block text-[11.5px] font-medium tracking-wide text-white/32">
              Mot de passe
            </label>
            <input
              id="edge-pwd"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("pwd")}
              onBlur={() => setFocusedField((f) => (f === "pwd" ? null : f))}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full border-none bg-transparent p-0 text-base text-white outline-none placeholder:text-white/22"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-white/40 transition hover:text-white/75"
              aria-label="Afficher le mot de passe"
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
          <div className="ml-1 mt-2 flex min-h-4 items-center gap-1.5">
            <div className="h-[3px] flex-1 overflow-hidden rounded-sm bg-white/[0.08]">
              <div
                className="h-full rounded-sm transition-all duration-350"
                style={{ width: `${strength.pct}%`, background: strength.bar }}
              />
            </div>
            <span className="whitespace-nowrap text-xs transition-colors" style={{ color: strength.color }}>
              {strength.label}
            </span>
          </div>
        </div>

        <div className="mb-[18px]">
          <div
            className={`relative rounded-2xl border px-[18px] py-3.5 backdrop-blur-sm transition-all duration-250 ${
              focusedField === "pwd2"
                ? "border-[rgba(61,123,255,0.55)] bg-white/10 shadow-[0_0_0_4px_rgba(61,123,255,0.12)]"
                : "border-white/[0.08] bg-white/[0.06]"
            }`}
          >
            <label htmlFor="edge-pwd2" className="mb-1 block text-[11.5px] font-medium tracking-wide text-white/32">
              Confirmez le mot de passe
            </label>
            <input
              id="edge-pwd2"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedField("pwd2")}
              onBlur={() => setFocusedField((f) => (f === "pwd2" ? null : f))}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full border-none bg-transparent p-0 text-base text-white outline-none placeholder:text-white/22"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-white/40 transition hover:text-white/75"
              aria-label="Afficher la confirmation"
            >
              {showConfirm ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
          <p
            className={`ml-1 mt-2 text-xs transition-opacity duration-200 ${
              confirmPassword.length > 0 ? "opacity-100" : "opacity-0"
            } ${passwordsMatch ? "text-[#34C759]" : passwordsMismatch ? "text-[#FF3B30]" : "text-white/32"}`}
          >
            {passwordsMatch
              ? "Les mots de passe correspondent"
              : passwordsMismatch
                ? "Les mots de passe ne correspondent pas"
                : "Les mots de passe correspondent"}
          </p>
        </div>

        <div className="min-h-6 flex-1" />

        {errorMessage ? (
          <p className="mb-3 rounded-xl border border-[#FF3B30]/35 bg-[#FF3B30]/10 px-4 py-3 text-sm text-[#FF6B5E]">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full rounded-2xl bg-white py-[17px] text-base font-semibold text-[#0a0a0a] transition ${
            canSubmit ? "opacity-100 hover:-translate-y-px" : "cursor-not-allowed opacity-30"
          }`}
        >
          {isLoading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Création…
            </span>
          ) : (
            "Accéder à mon espace"
          )}
        </button>
        <p className="mt-[18px] text-center text-xs text-white/32">
          {variant === "entreprise"
            ? "Essai 30 jours · sans engagement"
            : variant === "salarie"
              ? "Invitation entreprise · accès sécurisé"
              : "Inscription gratuite · sans engagement"}
        </p>
      </form>

      <div className="mx-auto mb-2 h-[5px] w-[134px] rounded-sm bg-white/40" aria-hidden />
      </div>
    </div>
  );
}
