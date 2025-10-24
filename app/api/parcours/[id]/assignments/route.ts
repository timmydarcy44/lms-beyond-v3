export const runtime = "nodejs";
import { ok, bad } from "@/lib/server/resp";
import { requireUser } from "@/lib/server/auth";
import { pathwayAssignmentsInput } from "@/lib/validation/pathways";

// POST /api/parcours/[id]/assignments - upsert learners/groups
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireUser();
  const body = await req.json();
  const parsed = pathwayAssignmentsInput.safeParse(body);
  if (!parsed.success) return bad(parsed.error.message);

  // nettoyage
  await sb.from("pathway_assignments").delete().eq("pathway_id", id);

  // recrée learners
  const learners = parsed.data.learners || [];
  for (const learnerId of learners) {
    const { error } = await sb.from("pathway_assignments").insert({
      pathway_id: id,
      learner_id: learnerId,
      group_id: null
    });
    if (error) return bad(error.message, 500);
  }

  // recrée groups
  const groups = parsed.data.groups || [];
  for (const groupId of groups) {
    const { error } = await sb.from("pathway_assignments").insert({
      pathway_id: id,
      learner_id: null,
      group_id: groupId
    });
    if (error) return bad(error.message, 500);
  }
  return ok(true);
}
