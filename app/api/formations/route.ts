export const runtime = "nodejs";
import { ok, bad } from "@/lib/server/resp";
import { requireUser } from "@/lib/server/auth";
import { createFormationInput } from "@/lib/validation/formations";

// GET /api/formations?org={slug}
export async function GET(req: Request) {
  const url = new URL(req.url);
  const org = url.searchParams.get("org");
  if (!org) return bad("ORG_SLUG_REQUIRED");

  const { sb } = await requireUser();
  const { data: orgRow } = await sb.from("organizations").select("id,slug").eq("slug", org).maybeSingle();
  if (!orgRow) return bad("ORG_NOT_FOUND", 404);

  const { data, error } = await sb.from("formations")
    .select("id, title, cover_url, created_at, updated_at")
    .eq("org_id", orgRow.id)
    .order("updated_at", { ascending: false });
  if (error) return bad(error.message, 500);
  return ok(data);
}

// POST /api/formations?org={slug}
export async function POST(req: Request) {
  const url = new URL(req.url);
  const org = url.searchParams.get("org");
  if (!org) return bad("ORG_SLUG_REQUIRED");
  const { sb, user } = await requireUser();

  const { data: orgRow } = await sb.from("organizations").select("id,slug").eq("slug", org).maybeSingle();
  if (!orgRow) return bad("ORG_NOT_FOUND", 404);

  const body = await req.json();
  const parsed = createFormationInput.safeParse(body);
  if (!parsed.success) return bad(parsed.error.message);

  const payload = { ...parsed.data, org_id: orgRow.id, created_by: user.id };
  const { data, error } = await sb.from("formations").insert(payload).select("id").single();
  if (error) return bad(error.message, 500);
  return ok({ id: data.id }, 201);
}
