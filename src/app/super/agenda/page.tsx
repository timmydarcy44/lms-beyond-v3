import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { AgendaView } from "@/components/super-admin/agenda/agenda-view";
import { Calendar } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminAgendaPage() {
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

  // Couleurs de branding Jessica Contentin
  const bgColor = "#F8F5F0";
  const textColor = "#2F2A25";
  const primaryColor = "#C6A664";
  const secondaryColor = "#E6D9C6";

  return (
    <main className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 
              className="text-4xl font-bold mb-2"
              style={{ color: textColor }}
            >
              Agenda
            </h1>
            <p 
              className="text-lg"
              style={{ color: textColor, opacity: 0.7 }}
            >
              Gérez vos plages horaires et rendez-vous
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/super/agenda/rendez-vous"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all shadow-lg hover:shadow-xl"
              style={{ backgroundColor: primaryColor }}
            >
              <Calendar className="h-4 w-4" />
              Mes rendez-vous
            </a>
            <a
              href="/reservation"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all shadow-lg hover:shadow-xl"
              style={{ backgroundColor: primaryColor }}
            >
              <Calendar className="h-4 w-4" />
              Voir la page de réservation
            </a>
          </div>
        </div>
        <AgendaView superAdminId={user.id} />
      </div>
    </main>
  );
}

