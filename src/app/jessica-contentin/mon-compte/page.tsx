import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { JessicaContentinAccountContent } from "@/components/jessica-contentin/account-content";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export default async function JessicaContentinAccountPage() {
  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/jessica-contentin/login?next=/jessica-contentin/mon-compte");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/jessica-contentin/login?next=/jessica-contentin/mon-compte");
  }

  // Récupérer l'ID de Jessica Contentin pour vérifier que l'utilisateur a accès à ses contenus
  const { data: jessicaProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", JESSICA_CONTENTIN_EMAIL)
    .maybeSingle();

  return (
    <JessicaContentinAccountContent userId={user.id} jessicaProfileId={jessicaProfile?.id} />
  );
}

