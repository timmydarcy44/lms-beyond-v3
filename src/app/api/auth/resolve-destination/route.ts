import { NextResponse } from "next/server";
import {
  pickPrimaryDestination,
  resolveDashboardSpaces,
  type ProfileRoutingInput,
} from "@/lib/auth/dashboard-routing";
import { resolveDestinationFromProfile } from "@/lib/auth/post-login-redirect";
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
    .select("id, email, role, role_type, school_id, company_id")
    .eq("id", user.id)
    .maybeSingle();

  let profile = profileById as ProfileRoutingInput | null;
  const emailValue = String(profileById?.email ?? user.email ?? "").trim().toLowerCase();
  if (!profile && emailValue) {
    const { data: profileByEmail } = await service
      .from("profiles")
      .select("id, email, role, role_type, school_id, company_id")
      .eq("email", emailValue)
      .limit(10);
    const rows = (profileByEmail as ProfileRoutingInput[] | null) ?? [];
    profile = rows.find((row) => String(row.id ?? "") === user.id) ?? rows[0] ?? null;
  }

  const roleDestination = resolveDestinationFromProfile(profile);
  if (roleDestination) {
    return NextResponse.json({ destination: roleDestination });
  }

  const { spaces } = await resolveDashboardSpaces(service, user.id, emailValue, profile);

  if (spaces.length > 1) {
    return NextResponse.json({ destination: "/dashboard" });
  }

  if (spaces.length === 1) {
    return NextResponse.json({ destination: spaces[0].href });
  }

  const fallback = pickPrimaryDestination(spaces);
  return NextResponse.json({ destination: fallback ?? "/dashboard" });
}
