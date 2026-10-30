import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { revokeBadgeAssertion } from "@/lib/openbadges/v3/revocation";
import { getServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    reason?: string;
    badgeClassId?: string;
    recipientProfileId?: string;
    assertionId?: string;
  } | null;
  const reason = String(body?.reason ?? "").trim();
  if (!reason) return NextResponse.json({ error: "REASON_REQUIRED" }, { status: 400 });

  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "STORAGE" }, { status: 503 });

  let assertionId = String(body?.assertionId ?? "").trim();
  if (!assertionId) {
    const badgeClassId = String(body?.badgeClassId ?? "").trim();
    const recipientProfileId = String(body?.recipientProfileId ?? "").trim();
    if (!badgeClassId || !recipientProfileId) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const { data } = await db
      .from("badge_assertions")
      .select("id")
      .eq("badge_class_id", badgeClassId)
      .eq("recipient_profile_id", recipientProfileId)
      .maybeSingle();
    assertionId = String(data?.id ?? "");
  }
  if (!assertionId) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const result = await revokeBadgeAssertion(db, assertionId, reason);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
