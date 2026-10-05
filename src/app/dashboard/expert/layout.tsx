import { redirect } from "next/navigation";
import { ExpertAccessProvider } from "@/components/expert/expert-access-provider";
import { ExpertRouteGuard } from "@/components/expert/expert-route-guard";
import { expertSetPasswordPath } from "@/lib/expert/signup-redirect";
import { loadOrCreateExpertProfile } from "@/lib/expert/load-expert-profile";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";

export default async function ExpertDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.id) {
    redirect("/login?next=/dashboard/expert");
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
        <ExpertRouteGuard>{children}</ExpertRouteGuard>
      </div>
    </ExpertAccessProvider>
  );
}
