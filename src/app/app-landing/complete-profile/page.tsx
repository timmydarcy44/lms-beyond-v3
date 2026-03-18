"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CompleteProfilePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const syncSession = async () => {
      try {
        console.log("[complete-profile] syncSession start");
        const hash = window.location.hash.replace(/^#/, "");
        const searchParams = new URLSearchParams(window.location.search);
        if (hash) {
          const params = new URLSearchParams(hash);
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          if (access_token && refresh_token) {
            console.log("[complete-profile] setSession from hash");
            await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
        }
        if (!hash) {
          const access_token = searchParams.get("access_token");
          const refresh_token = searchParams.get("refresh_token");
          if (access_token && refresh_token) {
            console.log("[complete-profile] setSession from query");
            await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
          }
        }

        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        console.log("[complete-profile] session exists:", !!data.session);
        setHasSession(!!data.session);
        if (data.session) {
          setError(null);
        }
      } catch (error) {
        console.error("[complete-profile] syncSession error:", error);
        if (!isMounted) return;
        setHasSession(false);
      } finally {
        if (!isMounted) return;
        setIsCheckingSession(false);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      console.log("[complete-profile] auth state change:", _event);
      setHasSession(!!session);
      if (session) {
        setError(null);
      }
    });

    syncSession();

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("[complete-profile] Bouton cliqué");
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!hasSession) {
      console.error("[complete-profile] No session detected");
      setError("Session non détectée. Merci d’ouvrir le lien depuis votre email.");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("[complete-profile] Calling updateUser");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        console.error("[complete-profile] updateUser error:", updateError);
        setError(updateError.message);
        return;
      }

      const isNevo = process.env.NEXT_PUBLIC_SITE_URL?.includes("nevo");
      console.log("[complete-profile] redirecting:", isNevo ? "/note-app" : "/library");
      router.push(isNevo ? "/note-app" : "/library");
    } catch (error) {
      console.error("[complete-profile] update flow error:", error);
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
        <h1 className="text-2xl font-semibold text-[#0F1117] mb-2">Créer mon mot de passe</h1>
        <p className="text-sm text-[#6B7280] mb-6">
          Votre compte est validé. Définissez votre mot de passe pour accéder à Nevo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={isSubmitting || isCheckingSession || !hasSession}
            className="w-full rounded-full px-5 py-3 text-white font-semibold cursor-pointer disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
          >
            {isCheckingSession
              ? "Vérification..."
              : isSubmitting
                ? "Activation..."
                : "Enregistrer mon mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
