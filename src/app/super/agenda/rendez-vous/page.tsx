import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { AppointmentsGridView } from "@/components/super-admin/agenda/appointments-grid-view";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminAppointmentsPage() {
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

  const isContentin = profile?.email === "contentin.cabinet@gmail.com";

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className={cn(
          "text-3xl font-semibold mb-2",
          isContentin ? "text-[#8B4513]" : "text-gray-900"
        )} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Mes rendez-vous
        </h1>
        <p className={cn(
          "text-sm",
          isContentin ? "text-[#A0522D]" : "text-gray-600"
        )} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
          Consultez tous vos rendez-vous avec les apprenants
        </p>
      </div>
      <AppointmentsGridView superAdminId={user.id} />
    </main>
  );
}

