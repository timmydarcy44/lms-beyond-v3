import { NextResponse } from "next/server";
import { normalizeProfileRoleKey, profileRolesIndicateSchoolDashboard } from "@/lib/auth/school-access";
import { isSuperAdminEmailAllowlisted } from "@/lib/auth/super-admin-email-allowlist";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const STUDENT_KEYS = new Set(["student", "apprenant", "particulier", "learner"]);

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
  const emailValue = String(profileById?.email ?? user.email ?? "").trim().toLowerCase();
  if (!profile && emailValue) {
    const { data: profileByEmail } = await service
      .from("profiles")
      .select("id, email, role, role_type, school_id")
      .eq("email", emailValue)
      .limit(10);
    const rows = (profileByEmail as Record<string, unknown>[] | null) ?? [];
    profile = rows.find((row) => String(row.id ?? "") === user.id) ?? rows[0] ?? null;
  }

  const r = normalizeProfileRoleKey(profile?.role);
  const rt = normalizeProfileRoleKey(profile?.role_type);
  const hasSchool = Boolean(profile?.school_id);
  /** Préserve l’agrégation historique lorsque normalize vide les deux colonnes rares */
  const primary = r || rt || String(profile?.role ?? profile?.role_type ?? "").trim().toLowerCase();

  if (isSuperAdminEmailAllowlisted(emailValue)) {
    return NextResponse.json({ destination: "/super" });
  }

  const { data: superAdminRow } = await service
    .from("super_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (superAdminRow) {
    return NextResponse.json({ destination: "/super" });
  }

  if (r === "super_admin" || rt === "super_admin" || primary === "super_admin") {
    return NextResponse.json({ destination: "/super" });
  }

  if (r === "admin" || rt === "admin" || primary === "admin") {
    return NextResponse.json({ destination: "/dashboard/ecole" });
  }

  /** École : `ecole`, variantes accentuées / métiers (`gestionnaire_ecole`, `establishment`, etc.). */
  if (profileRolesIndicateSchoolDashboard(profile?.role, profile?.role_type)) {
    return NextResponse.json({ destination: "/dashboard/ecole" });
  }

  const isStudentish = STUDENT_KEYS.has(r) || STUDENT_KEYS.has(rt) || STUDENT_KEYS.has(primary);

  if (isStudentish && !hasSchool) {
    return NextResponse.json({ destination: "/dashboard/apprenant" });
  }
  if (isStudentish && hasSchool) {
    return NextResponse.json({ destination: "/dashboard" });
  }

  if (primary === "demo") {
    return NextResponse.json({ destination: "/dashboard" });
  }

  if (primary === "club") {
    return NextResponse.json({ destination: "/dashboard/club" });
  }

  if (primary === "partenaire") {
    return NextResponse.json({ destination: "/dashboard/partenaire" });
  }

  if (primary === "tuteur") {
    return NextResponse.json({ destination: "/dashboard/tuteur" });
  }

  if (primary === "expert") {
    return NextResponse.json({ destination: "/dashboard/expert" });
  }

  const { data: expertRow } = await service.from("experts").select("id").eq("id", user.id).maybeSingle();
  if (expertRow) {
    return NextResponse.json({ destination: "/dashboard/expert" });
  }

  if (primary === "entreprise" || primary === "admin_hr" || primary === "client") {
    return NextResponse.json({ destination: "/dashboard/entreprise" });
  }

  if (primary === "instructor" || primary === "formateur") {
    return NextResponse.json({ destination: "/dashboard/formateur" });
  }

  if (primary === "mentor") {
    return NextResponse.json({ destination: "/dashboard/formateur" });
  }

  return NextResponse.json({ destination: "/dashboard" });
}
