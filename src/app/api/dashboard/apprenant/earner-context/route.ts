import { NextResponse } from "next/server";
import { resolveEarnerContextFromSession } from "@/lib/auth/earner-session";

export async function GET() {
  const ctx = await resolveEarnerContextFromSession();
  if (!ctx) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    userId: ctx.userId,
    orgId: ctx.orgId,
    orgIds: ctx.orgIds,
    role: ctx.role,
  });
}
