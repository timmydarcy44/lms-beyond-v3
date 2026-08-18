import { NextResponse } from "next/server";
import {
  pickPrimaryDestination,
  resolveDashboardSpaces,
  type ProfileRoutingInput,
} from "@/lib/auth/dashboard-routing";
import { resolveDestinationFromProfile } from "@/lib/auth/post-login-redirect";
import {
  canServeClubPartenaireDashboards,
  isClubDashboardPath,
  isPartenaireDashboardPath,
} from "@/lib/auth/beyond-center-host";
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

  const host = request.headers.get("host");
  const clubPartenaireEnabled = canServeClubPartenaireDashboards(host);
  const isClubPartenaireHref = (href: string) =>
    isClubDashboardPath(href) || isPartenaireDashboardPath(href);

  const roleDestination = resolveDestinationFromProfile(profile);
  if (roleDestination && (clubPartenaireEnabled || !isClubPartenaireHref(roleDestination))) {
    return NextResponse.json({ destination: roleDestination });
  }

  const { spaces } = await resolveDashboardSpaces(service, user.id, emailValue, profile);
  const visibleSpaces = clubPartenaireEnabled
    ? spaces
    : spaces.filter((space) => !isClubPartenaireHref(space.href));

  if (visibleSpaces.length > 1) {
    return NextResponse.json({ destination: "/dashboard" });
  }

  if (visibleSpaces.length === 1) {
    return NextResponse.json({ destination: visibleSpaces[0].href });
  }

  const fallback = pickPrimaryDestination(visibleSpaces);
  return NextResponse.json({ destination: fallback ?? "/dashboard" });
}
