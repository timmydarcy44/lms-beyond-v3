export const runtime = "nodejs";
import { ok, bad, notFound } from "@/lib/server/resp";
import { requireUser } from "@/lib/server/auth";
import { updateFormationInput } from "@/lib/validation/formations";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireUser();
  const { data } = await sb.from("formations").select("*, sections(*, chapters(*))").eq("id", id).maybeSingle();
  if (!data) return notFound();
  return ok(data);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireUser();
  const body = await req.json();
  const parsed = updateFormationInput.safeParse(body);
  if (!parsed.success) return bad(parsed.error.message);

  const { error } = await sb.from("formations").update(parsed.data).eq("id", id);
  if (error) return bad(error.message, 500);
  return ok(true);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb } = await requireUser();
  const { error } = await sb.from("formations").delete().eq("id", id);
  if (error) return bad(error.message, 500);
  return ok(true);
}
