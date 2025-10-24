import "server-only";
import { requireUser } from "./auth";

export async function resolveOrgBySlug(slug: string) {
  const { sb, user } = await requireUser();
  const { data: org } = await sb.from("organizations")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!org) throw new Response("ORG_NOT_FOUND", { status: 404 });

  // Optionnel: vérifier membership si nécessaire
  // const { data: mem } = await sb.from("org_memberships").select("id, role").eq("org_id", org.id).eq("user_id", user.id).maybeSingle();
  // if (!mem) throw new Response("FORBIDDEN", { status: 403 });

  return { sb, user, orgId: org.id, orgSlug: org.slug };
}
