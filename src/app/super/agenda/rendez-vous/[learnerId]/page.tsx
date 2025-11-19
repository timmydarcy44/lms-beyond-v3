import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { LearnerAppointmentDetail } from "@/components/super-admin/agenda/learner-appointment-detail";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function LearnerAppointmentDetailPage({
  params,
}: {
  params: { learnerId: string };
}) {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Vérifier que c'est bien contentin.cabinet@gmail.com
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  if (profile?.email !== "contentin.cabinet@gmail.com") {
    redirect("/super");
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <LearnerAppointmentDetail superAdminId={user.id} learnerId={params.learnerId} />
    </main>
  );
}

