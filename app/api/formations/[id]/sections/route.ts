export const runtime = "nodejs";
import { ok, bad } from "@/lib/server/resp";
import { requireUser } from "@/lib/server/auth";

// POST { sections: [{id?, title, position, chapters: [{id?, title, position}]}] }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireUser();
  const body = await req.json();

  // nettoyage
  await sb.from("chapters").delete().in("section_id",
    (await sb.from("sections").select("id").eq("formation_id", id)).data?.map(s => s.id) || []
  );
  await sb.from("sections").delete().eq("formation_id", id);

  // recrée
  const sections = body.sections || [];
  for (const s of sections) {
    const { data: sRow, error: sErr } = await sb.from("sections").insert({
      formation_id: id, title: s.title, order_index: s.position
    }).select("id").single();
    if (sErr) return bad(sErr.message, 500);

    for (const c of (s.chapters || [])) {
      const { error: cErr } = await sb.from("chapters").insert({
        section_id: sRow.id, title: c.title, order_index: c.position
      });
      if (cErr) return bad(cErr.message, 500);
    }
  }
  return ok(true);
}
