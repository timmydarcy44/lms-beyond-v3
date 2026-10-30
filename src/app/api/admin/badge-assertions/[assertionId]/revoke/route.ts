import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { revokeBadgeAssertion } from "@/lib/openbadges/v3/revocation";
import { getServiceRoleClient } from "@/lib/supabase/server";

type RouteParams = { assertionId: string };

export async function POST(request: NextRequest, context: { params: Promise<RouteParams> }) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const { assertionId } = await context.params;
  const body = (await request.json().catch(() => null)) as { reason?: string } | null;
  const reason = String(body?.reason ?? "").trim();
  if (!reason) return NextResponse.json({ error: "REASON_REQUIRED" }, { status: 400 });

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "STORAGE" }, { status: 503 });
  const result = await revokeBadgeAssertion(db, assertionId, reason);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
