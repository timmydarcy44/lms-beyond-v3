import { NextRequest, NextResponse } from "next/server";
import { COLLABORATOR_DASHBOARD_PATH } from "@/lib/entreprise/collaborator-invite";
import { resolveDestinationFromProfile } from "@/lib/auth/post-login-redirect";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Session expirée. Rouvrez le lien reçu par email." },
      { status: 401 },
    );
  }

  let body: { password?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const password = String(body.password ?? "");
  if (password.length < 8) {
    return NextResponse.json({ error: "Mot de passe trop court (8 caractères minimum)." }, { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({
    password,
    data: { needs_password_setup: false },
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const isCollaboratorInvite = Boolean(meta.employee_id);
  if (isCollaboratorInvite) {
    return NextResponse.json({ destination: COLLABORATOR_DASHBOARD_PATH });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, role_type, email, company_id")
    .eq("id", user.id)
    .maybeSingle();

  const destination = resolveDestinationFromProfile(profile) ?? "/dashboard";
  return NextResponse.json({ destination });
}
