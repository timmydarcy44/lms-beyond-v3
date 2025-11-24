"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        router.push("/jessica-contentin/login?error=service_unavailable");
        return;
      }

      // Récupérer le code d'authentification depuis l'URL
      const code = searchParams.get("code");
      const next = searchParams.get("next") || "/jessica-contentin/ressources";

      if (code) {
        // Échanger le code contre une session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("[auth/callback] Error exchanging code:", error);
          router.push(`/jessica-contentin/login?error=${encodeURIComponent(error.message)}`);
          return;
        }

        if (data.session && data.user) {
          // Créer ou mettre à jour le profil si nécessaire
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", data.user.id)
            .maybeSingle();

          if (!profile) {
            // Créer le profil pour les nouveaux utilisateurs OAuth
            const fullName = data.user.user_metadata?.full_name || 
                           data.user.user_metadata?.name || 
                           data.user.email?.split("@")[0] || 
                           "Utilisateur";

            await supabase.from("profiles").upsert({
              id: data.user.id,
              email: data.user.email,
              full_name: fullName,
              role: "learner",
              org_id: null, // B2C
            });
          }

          // Rediriger vers la page demandée
          router.push(next);
          router.refresh();
        } else {
          router.push("/jessica-contentin/login?error=no_session");
        }
      } else {
        router.push("/jessica-contentin/login?error=no_code");
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: "#C6A664" }} />
        <p className="text-[#2F2A25]">Connexion en cours...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: "#C6A664" }} />
          <p className="text-[#2F2A25]">Chargement...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

