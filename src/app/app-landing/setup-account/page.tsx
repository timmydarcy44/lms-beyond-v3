"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type SessionInfo = {
  user_id: string | null;
  customer_email: string | null;
  session_id: string;
};

export default function SetupAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setError("Session Stripe introuvable.");
      return;
    }
    fetch(`/api/nevo/stripe/session?session_id=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.error) {
          setError(data.error);
          return;
        }
        setSessionInfo(data);
      })
      .catch(() => setError("Impossible de charger la session."));
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!sessionInfo) {
      setError("Session Stripe introuvable.");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError("Merci de renseigner prénom et nom.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id || null;
      if (!userId) {
        setError("Merci d’ouvrir le lien depuis votre email pour vous connecter.");
        return;
      }

      if (sessionInfo?.user_id && sessionInfo.user_id !== userId) {
        setError("Cette session ne correspond pas à votre compte.");
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ first_name: firstName.trim(), last_name: lastName.trim() })
        .eq("id", userId);

      if (profileError) {
        setError(profileError.message);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }

      window.location.href = "/note-app";
    } catch {
      setError("Impossible de finaliser la configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-6 py-12">
      <img
        src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
        alt="Nevo"
        className="h-10 mb-10"
      />
      <div className="w-full max-w-md rounded-3xl border border-[#E8E9F0] bg-white shadow-sm p-8">
        <h1 className="text-2xl font-semibold text-[#0F1117] mb-2">Finaliser mon compte</h1>
        <p className="text-sm text-[#6B7280] mb-6">
          Renseignez vos informations pour activer votre accès Premium.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Prénom"
            className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
            required
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Nom"
            className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nouveau mot de passe"
            className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
            required
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirmer le mot de passe"
            className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
            required
          />
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full px-5 py-3 text-white font-semibold"
            style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
          >
            {isSubmitting ? "Activation..." : "Enregistrer mon mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
