export const runtime = "nodejs";
import { ok, bad } from "@/lib/server/resp";
import { requireUser } from "@/lib/server/auth";
import { pathwayItemsInput } from "@/lib/validation/pathways";

// POST /api/parcours/[id]/items - replace order
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireUser();
  const body = await req.json();
  const parsed = pathwayItemsInput.safeParse(body);
  if (!parsed.success) return bad(parsed.error.message);

  // nettoyage
  await sb.from("pathway_items").delete().eq("pathway_id", id);

  // recrée
  const items = parsed.data.items || [];
  for (const item of items) {
    const { error } = await sb.from("pathway_items").insert({
      pathway_id: id,
      item_type: item.type,
      item_id: item.id,
      position: item.position
    });
    if (error) return bad(error.message, 500);
  }
  return ok(true);
}
