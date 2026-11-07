import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { sendFormationDocument } from "@/lib/formation-documents/send";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as {
    kind?: string;
    to?: string;
  } | null;

  const kind = String(body?.kind ?? "").trim();
  if (!kind) return NextResponse.json({ error: "kind requis" }, { status: 400 });

  let actorUserId: string | null = null;
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    actorUserId = auth.user?.id ?? null;
  } catch {
    /* ignore */
  }

  const result = await sendFormationDocument(service, {
    dossierId: id,
    kind,
    to: body?.to,
    actorUserId,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code, sent_to: result.sent_to },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, sent_to: result.sent_to });
}
