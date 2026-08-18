import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canServeClubPartenaireDashboards } from "@/lib/auth/beyond-center-host";
import { canAccessClubDashboardFromProfile } from "@/lib/auth/club-access";
import { canAccessPartenaireDashboardFromProfile } from "@/lib/auth/partenaire-access";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";

export async function requireBeyondCenterClubPartenaireHost() {
  const host = (await headers()).get("host") ?? "";
  if (!canServeClubPartenaireDashboards(host)) {
    redirect("/");
  }
}

export async function requireClubDashboardAccess() {
  await requireBeyondCenterClubPartenaireHost();
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) redirect("/login");
  if (!canAccessClubDashboardFromProfile(profile, user.email)) {
    redirect("/unauthorized");
  }
}

export async function requirePartenaireDashboardAccess() {
  await requireBeyondCenterClubPartenaireHost();
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) redirect("/login");
  if (!canAccessPartenaireDashboardFromProfile(profile, user.email)) {
    redirect("/unauthorized");
  }
}
