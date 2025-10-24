import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

export async function requireUser() {
  const sb = await supabaseServer();
  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) throw new Response("UNAUTH", { status: 401 });
  return { sb, user };
}
