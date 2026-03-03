import { NextResponse } from "next/server";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ destination: "/dashboard" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ destination: "/login" });
  }

  await request.json().catch(() => ({}));
  const service = await getServiceRoleClientOrFallback();
  if (!service) {
    return NextResponse.json({ destination: "/dashboard" });
  }

  const { data: profileById } = await service
    .from("profiles")
    .select("id, email, role, role_type, school_id")
    .eq("id", user.id)
    .maybeSingle();

  let profile = profileById as Record<string, unknown> | null;
  const emailValue = String(profileById?.email ?? user.email ?? "").trim();
  if (!profile && emailValue) {
    const { data: profileByEmail } = await service
      .from("profiles")
      .select("id, email, role, role_type, school_id")
      .eq("email", emailValue)
      .limit(10);
    const rows = (profileByEmail as Record<string, unknown>[] | null) ?? [];
    profile = rows.find((row) => String(row.id ?? "") === user.id) ?? rows[0] ?? null;
  }

  const role = String(profile?.role ?? "").trim().toLowerCase();
  const roleType = String(profile?.role_type ?? "").trim().toLowerCase();
  const effectiveRole = role || roleType;
  const hasSchool = Boolean(profile?.school_id);
  const isParticulierOrStudent = effectiveRole === "student" || effectiveRole === "particulier";

  if (isParticulierOrStudent && !hasSchool) {
    return NextResponse.json({ destination: "/dashboard/apprenant" });
  }
  if (isParticulierOrStudent && hasSchool) {
    return NextResponse.json({ destination: "/dashboard" });
  }

  if (effectiveRole === "tuteur") {
    return NextResponse.json({ destination: "/dashboard/tuteur" });
  }

  if (effectiveRole === "admin" || effectiveRole === "super_admin" || effectiveRole === "mentor") {
    return NextResponse.json({ destination: "/dashboard/formateur" });
  }

  return NextResponse.json({ destination: "/dashboard" });
}
