import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { fetchJessicaAssignableCatalogItems } from "@/lib/jessica-contentin/sync-jessica-catalog";
import { CatalogueJessicaClient } from "./catalogue-jessica-client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CatalogueJessicaPage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return null;
  }

  // Récupérer l'ID de Jessica Contentin
  const { data: jessicaProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", JESSICA_CONTENTIN_EMAIL)
    .maybeSingle();

  if (!jessicaProfile) {
    return null;
  }

  const catalogItems = await fetchJessicaAssignableCatalogItems(supabase);

  return (
    <CatalogueJessicaClient 
      items={(catalogItems || []).map((item) => ({
        id: item.id,
        title: item.title,
        item_type: item.item_type as "module" | "ressource" | "test" | "parcours",
        content_id: item.content_id || item.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))} 
      jessicaProfileId={jessicaProfile.id}
    />
  );
}
