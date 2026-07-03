import { redirect } from "next/navigation";
import { ExpertAccessProvider } from "@/components/expert/expert-access-provider";
import { ExpertRouteGuard } from "@/components/expert/expert-route-guard";
import { expertSetPasswordPath } from "@/lib/expert/signup-redirect";
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

  const { data: expert } = await supabase.from("experts").select("*").eq("id", session.id).maybeSingle();

  if (!expert) {
    redirect("/unauthorized");
  }

  const emailConfirmed = Boolean(user?.email_confirmed_at) || user?.user_metadata?.needs_password_setup === false;

  return (
    <ExpertAccessProvider expert={expert} emailConfirmed={emailConfirmed}>
      <ExpertRouteGuard>{children}</ExpertRouteGuard>
    </ExpertAccessProvider>
  );
}
