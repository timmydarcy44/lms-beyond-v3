export const runtime = "nodejs";
import { ok, bad } from "@/lib/server/resp";
import { requireUser } from "@/lib/server/auth";

// GET /api/lists/learners?org={slug}
export async function GET(req: Request) {
  const url = new URL(req.url);
  const org = url.searchParams.get("org");
  if (!org) return bad("ORG_SLUG_REQUIRED");

  const { sb } = await requireUser();
  const { data: orgRow } = await sb.from("organizations").select("id,slug").eq("slug", org).maybeSingle();
  if (!orgRow) return bad("ORG_NOT_FOUND", 404);

  const { data, error } = await sb.from("org_memberships")
    .select("users:user_id(id, email)")
    .eq("org_id", orgRow.id)
    .eq("role", "learner");
  if (error) return bad(error.message, 500);
  
  const learners = (data ?? []).map((m: any) => m.users).filter(Boolean);
  return ok(learners);
}
