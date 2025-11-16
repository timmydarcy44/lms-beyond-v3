import { getServerClient } from "@/lib/supabase/server";
import { getOrganizationLogo } from "@/lib/queries/super-admin";
import { getUserName } from "@/lib/utils/user-name";
import Image from "next/image";
import { LoadingRedirect } from "@/components/loading/loading-redirect";

export default async function LoadingPage() {
  const supabase = await getServerClient();
  let organizationLogo: string | null = null;
  let firstName = "";

  if (supabase) {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Récupérer le prénom
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", authUser.id)
          .single();
        
        firstName = getUserName(profile?.full_name || authUser.email || "");
        
        // Récupérer l'organisation de l'utilisateur
        const { data: membership } = await supabase
          .from("org_memberships")
          .select("org_id")
          .eq("user_id", authUser.id)
          .limit(1)
          .single();
        
        if (membership?.org_id) {
          organizationLogo = await getOrganizationLogo(membership.org_id);
        }
      }
    } catch (error) {
      console.error("[loading] Error fetching user data:", error);
    }
  }

  return (
    <>
      <LoadingRedirect />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="flex items-center justify-center gap-6">
          {/* Logo de l'organisation (si disponible) - à gauche */}
          {organizationLogo && (
            <div className="relative w-24 h-24 animate-fade-in">
              <Image
                src={organizationLogo}
                alt="Logo organisation"
                fill
                className="object-contain"
                priority
              />
            </div>
          )}
          
          {/* Message de bienvenue avec animation séquentielle - à droite du logo */}
          <div>
            <h1 className="text-4xl font-light text-gray-900 animate-fade-in-delay">
              {firstName ? `Bonjour ${firstName}` : "Bonjour"}
            </h1>
          </div>
        </div>
      </div>
    </>
  );
}
