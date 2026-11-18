import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canServeClubPartenaireDashboards } from "@/lib/auth/beyond-center-host";
import { canAccessClubDashboardFromProfile } from "@/lib/auth/club-access";
import { canAccessPartenaireDashboardFromProfile } from "@/lib/auth/partenaire-access";
import { isSuperAdminEmailAllowlisted } from "@/lib/auth/super-admin-email-allowlist";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";

export async function requireBeyondCenterClubPartenaireHost() {
  const host = (await headers()).get("host") ?? "";
  if (!canServeClubPartenaireDashboards(host)) {
    redirect("/");
  }
}

function isPrivilegedClubViewer(userEmail?: string | null, profileEmail?: string | null): boolean {
  return (
    isJadeDemoEmail(userEmail) ||
    isJadeDemoEmail(profileEmail) ||
    isSuperAdminEmailAllowlisted(userEmail) ||
    isSuperAdminEmailAllowlisted(profileEmail)
  );
}

export async function requireClubDashboardAccess() {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) redirect("/login");
  const privileged = isPrivilegedClubViewer(user.email, profile?.email);
  // Super-admins (ex. timmydarcy44@gmail.com) : accès aussi hors beyondcenter.fr
  if (!privileged) await requireBeyondCenterClubPartenaireHost();
  if (!privileged && !canAccessClubDashboardFromProfile(profile, user.email)) {
    redirect("/unauthorized");
  }
}

export async function requirePartenaireDashboardAccess() {
  const { user, profile } = await getCurrentProfileWithAccess();
  if (!user?.id) redirect("/login");
  const privileged = isPrivilegedClubViewer(user.email, profile?.email);
  if (!privileged) await requireBeyondCenterClubPartenaireHost();
  if (!privileged && !canAccessPartenaireDashboardFromProfile(profile, user.email)) {
    redirect("/unauthorized");
  }
}
