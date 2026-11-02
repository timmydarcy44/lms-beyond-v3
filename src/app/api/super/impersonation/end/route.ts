import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { IMPERSONATION_COOKIE } from "@/lib/control/constants";
import { buildActivityRow } from "@/lib/control/policy";
import { readImpersonationContext } from "@/lib/control/session";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const current = await readImpersonationContext();
  const service = getServiceRoleClient();
  if (service && current) {
    await service.from("impersonation_sessions").update({ ended_at: new Date().toISOString() }).eq("id", current.sid).eq("staff_user_id", data.user.id);
    await service.from("org_activity").insert(
      buildActivityRow({
        orgId: current.orgId,
        actorUserId: data.user.id,
        actorType: "byound_on_behalf",
        action: "impersonation_end",
        impersonationSessionId: current.sid,
      }),
    );
  }
  const response = NextResponse.json({ ok: true, orgId: current?.orgId ?? null });
  response.cookies.set(IMPERSONATION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
