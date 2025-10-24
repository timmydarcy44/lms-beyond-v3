import "server-only";
import { requireUser } from "./auth";
import { supabaseServer } from "@/lib/supabase/server";

export async function resolveOrgFromParamOrEnv(paramSlug?: string) {
  const slug = (paramSlug || process.env.SINGLE_ORG_SLUG || "").toLowerCase().trim();
  
  if (!slug) {
    throw new Response("SINGLE_ORG_{SLUG|ID} missing", { status: 400 });
  }

  const { sb, user } = await requireUser();
  
  const { data: org, error } = await sb
    .from("organizations")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();
    
  if (error) {
    throw new Response(error.message, { status: 500 });
  }
  
  if (!org) {
    throw new Response("ORG_NOT_FOUND", { status: 404 });
  }

  return { 
    sb, 
    user, 
    orgId: org.id, 
    orgSlug: org.slug,
    orgName: org.name 
  };
}