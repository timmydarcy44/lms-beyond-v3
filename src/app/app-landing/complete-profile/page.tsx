"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, LogOut, User } from "lucide-react";
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getTokensFromUrl = () => {
    const hash = window.location.hash.replace(/^#/, "");
    const searchParams = new URLSearchParams(window.location.search);
    const params = new URLSearchParams(hash || "");
    const access_token =
      params.get("access_token") || searchParams.get("access_token");
    const refresh_token =
      params.get("refresh_token") || searchParams.get("refresh_token");
    return { access_token, refresh_token };
  };

  useEffect(() => {
    let isMounted = true;
    const syncSession = async () => {
      try {
        console.log("[complete-profile] syncSession start");
        const { data: initialSession } = await supabase.auth.getSession();
        let session = initialSession?.session ?? null;

        if (!session) {
          const { access_token, refresh_token } = getTokensFromUrl();
          if (access_token && refresh_token) {
            console.log("[complete-profile] setSession from URL tokens");
            await supabase.auth.setSession({ access_token, refresh_token });
            const { data: refreshed } = await supabase.auth.getSession();
            session = refreshed.session ?? null;
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
        }

        if (!isMounted) return;
        console.log("[complete-profile] session exists:", !!session);
        setHasSession(!!session);
        if (session) {
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

    setIsSubmitting(true);
    try {
      const { data: currentSession } = await supabase.auth.getSession();
      if (!currentSession?.session) {
        const { access_token, refresh_token } = getTokensFromUrl();
        if (access_token && refresh_token) {
          console.log("[complete-profile] setSession in submit");
          await supabase.auth.setSession({ access_token, refresh_token });
        }
      }
      const { data: sessionAfterSet } = await supabase.auth.getSession();
      if (!sessionAfterSet?.session) {
        console.error("[complete-profile] Auth session missing");
        setError("Erreur de connexion : merci de cliquer à nouveau sur le lien reçu par mail.");
        return;
      }
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      window.location.href = "https://www.nevo-app.fr/app-landing/login";
    } catch {
      setError("Erreur lors de la déconnexion.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#0F1117]">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-64 bg-[#be1354] text-white flex-col">
          <div className="px-6 py-6">
            <img
              src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
              alt="Nevo"
              className="h-14 object-contain"
            />
          </div>
          <div className="px-4 space-y-2 mb-4">
            <button
              type="button"
              onClick={() => router.push("/note-app")}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all hover:bg-white/10"
            >
              <BookOpen className="h-4 w-4 text-white" />
              <span className="text-sm">Bibliothèque</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/note-app/profile")}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all hover:bg-white/10"
            >
              <User className="h-4 w-4 text-white" />
              <span className="text-sm">Mon Profil</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all hover:bg-white/10 text-white/90"
            >
              <LogOut className="h-4 w-4 text-white" />
              <span className="text-sm">{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 px-6 py-12">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-[#E8E9F0] bg-white shadow-sm p-8">
            <div className="text-center mb-6">
              <img
                src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
                alt="Nevo"
                className="h-10 mx-auto mb-4"
              />
              <h1 className="text-2xl font-semibold text-[#0F1117] mb-2">Créer mon mot de passe</h1>
              <p className="text-sm text-[#6B7280]">
                Votre compte est validé. Définissez votre mot de passe pour accéder à Nevo.
              </p>
            </div>

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
                disabled={isSubmitting}
                className="w-full rounded-full px-5 py-3 text-white font-semibold cursor-pointer pointer-events-auto"
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
      </div>
    </div>
  );
}
