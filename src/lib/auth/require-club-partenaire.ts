import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canServeClubPartenaireDashboards } from "@/lib/auth/beyond-center-host";
import { canAccessClubDashboardFromProfile } from "@/lib/auth/club-access";
import { canAccessPartenaireDashboardFromProfile } from "@/lib/auth/partenaire-access";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";

export async function requireBeyondCenterClubPartenaireHost() {
  const host = (await headers()).get("host") ?? "";
  if (!canServeClubPartenaireDashboards(host)) {
    redirect("/");
  }
}

export async function requireClubDashboardAccess() {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) redirect("/login");
  const jade = isJadeDemoEmail(user.email) || isJadeDemoEmail(profile?.email);
  if (!jade) await requireBeyondCenterClubPartenaireHost();
  if (!jade && !canAccessClubDashboardFromProfile(profile, user.email)) {
    redirect("/unauthorized");
  }
}

export async function requirePartenaireDashboardAccess() {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) redirect("/login");
  const jade = isJadeDemoEmail(user.email) || isJadeDemoEmail(profile?.email);
  if (!jade) await requireBeyondCenterClubPartenaireHost();
  if (!jade && !canAccessPartenaireDashboardFromProfile(profile, user.email)) {
    redirect("/unauthorized");
  }
}
