import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { CatalogueJessicaClient } from "./catalogue-jessica-client";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

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

  // Récupérer tous les catalog_items de Jessica
  const { data: catalogItems } = await supabase
    .from("catalog_items")
    .select("id, title, item_type, content_id, is_active, created_at, updated_at")
    .eq("creator_id", jessicaProfile.id)
    .order("created_at", { ascending: false });

  return (
    <CatalogueJessicaClient 
      items={catalogItems || []} 
      jessicaProfileId={jessicaProfile.id}
    />
  );
}
