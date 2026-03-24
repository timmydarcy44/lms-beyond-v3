"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createSupabaseBrowserClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!password.trim()) {
      setError("Veuillez saisir un nouveau mot de passe.");
      return;
    }
    if (password.trim() !== confirmPassword.trim()) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setIsSubmitting(true);
    try {
      if (!supabase) {
        setError("Supabase n'est pas configuré.");
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: password.trim() });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setSuccess("Mot de passe mis à jour. Vous pouvez vous reconnecter.");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Impossible de mettre à jour le mot de passe.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-6 text-3xl font-semibold bg-gradient-to-r from-[#f97316] to-[#ef4444] bg-clip-text text-transparent">
        Nevo
      </div>
      <div className="w-full max-w-md rounded-3xl border border-[#E8E9F0] bg-white shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-[#0F1117] mb-2">Nouveau mot de passe</h1>
        <p className="text-sm text-[#6B7280] mb-6">Choisissez un mot de passe sécurisé.</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <label className="block text-xs font-medium text-[#111827]">
            Nouveau mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
              className="mt-2 w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#f97316]"
              required
            />
          </label>
          <label className="block text-xs font-medium text-[#111827]">
            Confirmer le nouveau mot de passe
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le nouveau mot de passe"
              className="mt-2 w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#f97316]"
              required
            />
          </label>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          {success ? <p className="text-xs text-green-600">{success}</p> : null}
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !password.trim() ||
              !confirmPassword.trim() ||
              password.trim() !== confirmPassword.trim()
            }
            className="w-full rounded-full bg-gradient-to-r from-[#f97316] to-[#ef4444] px-5 py-3 text-white font-semibold"
          >
            {isSubmitting ? "Mise à jour..." : "Confirmer"}
          </button>
        </form>
      </div>
    </div>
  );
}
