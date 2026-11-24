import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import {
  buildLearnerPreviewCookie,
  LEARNER_PREVIEW_COOKIE,
} from "@/lib/control/learner-preview";
import { isBtocRole } from "@/lib/control/btoc-client-file";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) {
    return NextResponse.json({ active: false }, { status: 200 });
  }
  const { readLearnerPreviewContext } = await import("@/lib/control/learner-preview");
  const preview = await readLearnerPreviewContext();
  if (!preview || preview.expired || preview.staffId !== data.user.id) {
    return NextResponse.json({ active: false });
  }
  const service = getServiceRoleClient();
  let firstName: string | null = null;
  let lastName: string | null = null;
  let email: string | null = null;
  let avatarUrl: string | null = null;
  if (service) {
    const { data: target } = await service
      .from("profiles")
      .select("first_name, last_name, email, avatar_url, role, role_type")
      .eq("id", preview.targetUserId)
      .maybeSingle();
    if (target) {
      firstName = target.first_name ? String(target.first_name) : null;
      lastName = target.last_name ? String(target.last_name) : null;
      email = target.email ? String(target.email) : null;
      avatarUrl =
        "avatar_url" in target && target.avatar_url ? String(target.avatar_url) : null;
    }
  }
  return NextResponse.json({
    active: true,
    targetUserId: preview.targetUserId,
    targetName: preview.targetName,
    firstName,
    lastName,
    email,
    avatarUrl,
    expiresAt: preview.exp,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user || isJadeDemoEmail(user.email) || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { userId?: string };
  const userId = String(body.userId ?? "").trim();
  if (!userId) return NextResponse.json({ error: "userId requis" }, { status: 400 });

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: profile } = await service
    .from("profiles")
    .select("id, email, full_name, first_name, last_name, role, role_type")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  if (
    !isBtocRole(
      (profile as { role?: string }).role,
      (profile as { role_type?: string | null }).role_type,
    )
  ) {
    return NextResponse.json({ error: "Réservé aux clients BtoC / apprenants" }, { status: 400 });
  }

  const targetName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
    String(profile.full_name ?? profile.email ?? "Client");

  const cookie = await buildLearnerPreviewCookie({
    staffId: user.id,
    targetUserId: userId,
    targetName,
  });
  if (!cookie) {
    return NextResponse.json({ error: "Secret d'accompagnement manquant" }, { status: 503 });
  }

  const response = NextResponse.json({
    ok: true,
    targetUserId: userId,
    targetName,
    href: "/dashboard/apprenant",
  });
  response.cookies.set(LEARNER_PREVIEW_COOKIE, cookie.token, cookie.options);
  return response;
}
