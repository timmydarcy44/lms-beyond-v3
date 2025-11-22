import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { BeyondConnectHeader } from "@/components/beyond-connect/beyond-connect-header";
import { getServerClient } from "@/lib/supabase/server";

export default async function BeyondConnectAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/beyond-connect/login?next=/beyond-connect-app");
  }

  // Vérifier que l'utilisateur est un apprenant BtoC (sans organisation)
  // Beyond Connect est uniquement accessible aux clients BtoC de Beyond No School
  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/beyond-connect/login?next=/beyond-connect-app");
  }

  // Vérifier le rôle
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", session.id)
    .single();

  if (!profile || (profile.role !== "learner" && profile.role !== "student")) {
    redirect("/beyond-connect?error=access_denied");
  }

  // Vérifier qu'il n'a pas d'organisation (BtoC uniquement)
  const { data: membership } = await supabase
    .from("org_memberships")
    .select("id")
    .eq("user_id", session.id)
    .maybeSingle();

  if (membership) {
    // L'utilisateur appartient à une organisation (BtoB) - accès refusé
    redirect("/beyond-connect?error=access_denied");
  }

  return (
    <div className="min-h-screen bg-white">
      <BeyondConnectHeader user={session} />
      <main>{children}</main>
    </div>
  );
}

