import { redirect } from "next/navigation";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { JessicaContentinAccountContent } from "@/components/jessica-contentin/account-content";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export default async function JessicaContentinAccountPage() {
  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login?next=/mon-compte");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/mon-compte");
  }

  // Récupérer l'ID de Jessica Contentin pour vérifier que l'utilisateur a accès à ses contenus
  // Utiliser le service role client pour éviter les problèmes de RLS
  const serviceClient = getServiceRoleClient();
  const clientToUse = serviceClient || supabase;
  
  const { data: jessicaProfile } = await clientToUse
    .from("profiles")
    .select("id, email")
    .eq("email", JESSICA_CONTENTIN_EMAIL)
    .maybeSingle();

  const { data: userProfile } = await clientToUse
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <JessicaContentinAccountContent
      userId={user.id}
      jessicaProfileId={jessicaProfile?.id}
      firstName={userProfile?.first_name}
    />
  );
}

