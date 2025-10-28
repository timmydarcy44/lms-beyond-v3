import { createSupabaseServerClient, requireUser } from "@/lib/supabase/server";

export async function getDashboardData() {
  const sb = await createSupabaseServerClient();
  const user = await requireUser();

  const [{ data: formations }, { data: pathways }, { data: resources }, { data: tests }] =
    await Promise.all([
      sb.from("formations").select("id,title,description,updated_at,cover_url").eq("owner_id", user!.id).order("updated_at", { ascending: false }).limit(12),
      sb.from("pathways").select("id,title,description,updated_at,cover_url").eq("owner_id", user!.id).order("updated_at", { ascending: false }).limit(12),
      sb.from("resources").select("id,title,description,updated_at,cover_url").eq("owner_id", user!.id).order("updated_at", { ascending: false }).limit(12),
      sb.from("tests").select("id,title,description,updated_at,cover_url").eq("owner_id", user!.id).order("updated_at", { ascending: false }).limit(12),
    ]);

  return { 
    formations: formations ?? [], 
    pathways: pathways ?? [], 
    resources: resources ?? [], 
    tests: tests ?? [] 
  };
}
