import { NextResponse } from "next/server";
import { resolveEnterpriseViewerDisplay } from "@/lib/entreprise/resolve-viewer-display";
import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Profil viewer entreprise (service role) — nom fiable pour sidebar / en-tête. */
export async function GET() {
  const authClient = await createSupabaseServerClient();
  if (!authClient) {
    return NextResponse.json({ error: "Configuration manquante" }, { status: 500 });
  }

  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const db = getServiceRoleClient() ?? authClient;
  const { data: profile } = await db
    .from("profiles")
    .select("first_name, last_name, full_name, email, company_id, role, role_type")
    .eq("id", user.id)
    .maybeSingle();

  const viewer = resolveEnterpriseViewerDisplay(
    profile,
    user.email,
    user.user_metadata as Record<string, unknown>,
  );

  return NextResponse.json({
    ...viewer,
    userId: user.id,
    company_id: (profile as { company_id?: string | null } | null)?.company_id ?? null,
  });
}
