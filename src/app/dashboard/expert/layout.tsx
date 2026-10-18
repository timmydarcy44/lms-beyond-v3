import { redirect } from "next/navigation";
import { JadeInternalFill } from "@/components/demo/jade-internal-fill";
import { ExpertAccessProvider } from "@/components/expert/expert-access-provider";
import { ExpertRouteGuard } from "@/components/expert/expert-route-guard";
import { expertSetPasswordPath } from "@/lib/expert/signup-redirect";
import { loadOrCreateExpertProfile } from "@/lib/expert/load-expert-profile";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { JADE_EXPERT } from "@/lib/demo/jade-dashboard-mocks";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";

export default async function ExpertDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.id) {
    redirect("/login?next=/dashboard/expert");
  }

  if (isJadeDemoEmail(session.email)) {
    return (
      <ExpertAccessProvider expert={JADE_EXPERT} emailConfirmed>
        <div className="min-h-screen bg-[#070b1f] text-white">
          <ExpertRouteGuard>
            <JadeInternalFill>{children}</JadeInternalFill>
          </ExpertRouteGuard>
        </div>
      </ExpertAccessProvider>
    );
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login?next=/dashboard/expert");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.user_metadata?.needs_password_setup === true) {
    redirect(expertSetPasswordPath());
  }

  const expert = await loadOrCreateExpertProfile(supabase, session.id, user);

  if (!expert) {
    redirect("/login?next=/dashboard/expert");
  }

  const emailConfirmed = Boolean(user?.email_confirmed_at) || user?.user_metadata?.needs_password_setup === false;

  return (
    <ExpertAccessProvider expert={expert} emailConfirmed={emailConfirmed}>
      <div className="min-h-screen bg-[#070b1f] text-white [color-scheme:dark] [&_input]:bg-white/[0.05] [&_input]:text-white [&_input]:placeholder:text-white/35 [&_select]:bg-white/[0.05] [&_select]:text-white [&_textarea]:bg-white/[0.05] [&_textarea]:text-white [&_textarea]:placeholder:text-white/35">
        <ExpertRouteGuard>
          <JadeInternalFill>{children}</JadeInternalFill>
        </ExpertRouteGuard>
      </div>
    </ExpertAccessProvider>
  );
}
