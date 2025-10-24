export const runtime = "nodejs";
import { ok, bad } from "@/lib/server/resp";
import { requireUser } from "@/lib/server/auth";
import { pathwayMetaInput } from "@/lib/validation/pathways";
import { withTrace } from "@/lib/server/withTrace";

// GET /api/parcours?org={slug}
export async function GET(req: Request) {
  return withTrace(req, async () => {
    const url = new URL(req.url);
    const org = url.searchParams.get("org");
    if (!org) return bad("ORG_SLUG_REQUIRED", 400, "MISSING_ORG");

    const { sb } = await requireUser();
    const { data: orgRow } = await sb.from("organizations").select("id,slug").eq("slug", org).maybeSingle();
    if (!orgRow) return bad("ORG_NOT_FOUND", 404, "ORG_NOT_FOUND");

    const { data, error } = await sb.from("pathways")
      .select("id, title, cover_url, created_at, updated_at")
      .eq("org_id", orgRow.id)
      .order("updated_at", { ascending: false });
    if (error) return bad(error.message, 500, "DB_ERROR");
    return ok(data);
  });
}

// POST /api/parcours?org={slug}
export async function POST(req: Request) {
  return withTrace(req, async () => {
    const url = new URL(req.url);
    const org = url.searchParams.get("org");
    if (!org) return bad("ORG_SLUG_REQUIRED", 400, "MISSING_ORG");
    const { sb, user } = await requireUser();

    const { data: orgRow } = await sb.from("organizations").select("id,slug").eq("slug", org).maybeSingle();
    if (!orgRow) return bad("ORG_NOT_FOUND", 404, "ORG_NOT_FOUND");

    const body = await req.json();
    const parsed = pathwayMetaInput.safeParse(body);
    if (!parsed.success) return bad(parsed.error.message, 400, "VALIDATION_ERROR");

    const payload = { ...parsed.data, org_id: orgRow.id, created_by: user.id };
    const { data, error } = await sb.from("pathways").insert(payload).select("id").single();
    if (error) return bad(error.message, 500, "DB_ERROR");
    return ok({ id: data.id }, 201);
  });
}
