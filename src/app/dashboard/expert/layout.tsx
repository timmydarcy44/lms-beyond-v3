import { redirect } from "next/navigation";
import { JadeInternalFill } from "@/components/demo/jade-internal-fill";
import { ExpertAccessProvider } from "@/components/expert/expert-access-provider";
import { ExpertRouteGuard } from "@/components/expert/expert-route-guard";
import { ExpertShell } from "@/components/expert/expert-shell";
import { expertSetPasswordPath } from "@/lib/expert/signup-redirect";
import { loadOrCreateExpertProfile } from "@/lib/expert/load-expert-profile";
import { isEdgeCertified } from "@/lib/expert/expert-certification";
import type { ExpertAccessRow } from "@/lib/expert/expert-access";
import { isExpertApproved } from "@/lib/expert/expert-access";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { JADE_EXPERT } from "@/lib/demo/jade-dashboard-mocks";
import { isSuperAdminEmailAllowlisted } from "@/lib/auth/super-admin-email-allowlist";
import { getSession } from "@/lib/auth/session";
import { loadExpertPoleState, type ExpertMembership, type ExpertPole } from "@/lib/expert/poles";
import { getServerClient } from "@/lib/supabase/server";
import "@/styles/expert-theme.css";

function ExpertFrame({
  expert,
  emailConfirmed,
  pole,
  memberships,
  managerPoles,
  children,
}: {
  expert: ExpertAccessRow;
  emailConfirmed: boolean;
  pole: ExpertPole;
  memberships: ExpertMembership[];
  managerPoles: ExpertPole[];
  children: React.ReactNode;
}) {
  const name = [expert.first_name, expert.last_name].filter(Boolean).join(" ").trim() || "Expert";
  return (
    <ExpertAccessProvider expert={expert} emailConfirmed={emailConfirmed}>
      <div className="expert-theme">
        <ExpertRouteGuard>
          <ExpertShell
            name={name}
            certified={isEdgeCertified(expert)}
            restricted={!isExpertApproved(expert)}
            photoUrl={expert.photo_url || expert.avatar_url}
            pole={pole}
            memberships={memberships}
            managerPoles={managerPoles}
          >
            <JadeInternalFill>{children}</JadeInternalFill>
          </ExpertShell>
        </ExpertRouteGuard>
      </div>
    </ExpertAccessProvider>
  );
}

export default async function ExpertDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.id) {
    redirect("/login?next=/dashboard/expert");
  }

  if (isJadeDemoEmail(session.email)) {
    return (
      <ExpertFrame expert={JADE_EXPERT} emailConfirmed pole="formation" memberships={[]} managerPoles={[]}>
        {children}
      </ExpertFrame>
    );
  }

  const superAdmin = isSuperAdminEmailAllowlisted(session.email);
  const supabase = await getServerClient();
  if (!supabase) {
    redirect(superAdmin ? "/super" : "/login?next=/dashboard/expert");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.user_metadata?.needs_password_setup === true) {
    redirect(expertSetPasswordPath());
  }

  const expert = await loadOrCreateExpertProfile(supabase, session.id, user);

  if (!expert) {
    redirect(superAdmin ? "/super" : "/login?next=/dashboard/expert");
  }

  const emailConfirmed = Boolean(user?.email_confirmed_at) || user?.user_metadata?.needs_password_setup === false;
  let poles: Awaited<ReturnType<typeof loadExpertPoleState>>;
  try {
    poles = await loadExpertPoleState();
  } catch {
    poles = { ready: false, pole: "formation", memberships: [], managerPoles: [] };
  }

  return (
    <ExpertFrame
      expert={expert}
      emailConfirmed={emailConfirmed}
      pole={poles.pole}
      memberships={poles.memberships}
      managerPoles={poles.managerPoles}
    >
      {children}
    </ExpertFrame>
  );
}
