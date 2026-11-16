import { QualiopiQualiteV2Panel } from "@/components/super-admin/qualiopi-qualite-v2-panel";
import { QUALIOPI_PAGE_BG } from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { isSignalementStaff } from "@/lib/qualiopi/is-signalement-staff";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QualiopiQualitePage() {
  let canAccessSignalements = false;
  try {
    if (await isSuperAdmin()) {
      canAccessSignalements = true;
    } else {
      const userClient = await getServerClient();
      const service = getServiceRoleClient();
      const userId = userClient
        ? (await userClient.auth.getUser()).data.user?.id ?? null
        : null;
      if (service && userId) {
        canAccessSignalements = await isSignalementStaff(service, userId);
      }
    }
  } catch {
    canAccessSignalements = false;
  }

  return (
    <div className={cn(QUALIOPI_PAGE_BG, "min-h-[calc(100vh-5rem)] space-y-8 px-3 py-6 sm:px-6 sm:py-8")}>
      <QualiopiQualiteV2Panel canAccessSignalements={canAccessSignalements} />
    </div>
  );
}
