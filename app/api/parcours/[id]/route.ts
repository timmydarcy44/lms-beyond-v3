export const runtime = "nodejs";
import { ok, bad, notFound } from "@/lib/server/resp";
import { requireUser } from "@/lib/server/auth";
import { pathwayMetaInput } from "@/lib/validation/pathways";

// GET /api/parcours/[id] - details avec items et assignments
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireUser();
  
  const { data: pathway } = await sb.from("pathways")
    .select(`
      *,
      pathway_items(*),
      pathway_assignments(*)
    `)
    .eq("id", id)
    .maybeSingle();
    
  if (!pathway) return notFound();
  return ok(pathway);
}

// PUT /api/parcours/[id] - update meta
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireUser();
  const body = await req.json();
  const parsed = pathwayMetaInput.safeParse(body);
  if (!parsed.success) return bad(parsed.error.message);

  const { error } = await sb.from("pathways").update(parsed.data).eq("id", id);
  if (error) return bad(error.message, 500);
  return ok(true);
}

// DELETE /api/parcours/[id]
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireUser();
  const { error } = await sb.from("pathways").delete().eq("id", id);
  if (error) return bad(error.message, 500);
  return ok(true);
}
