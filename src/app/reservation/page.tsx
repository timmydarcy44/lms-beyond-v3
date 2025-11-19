import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { AppointmentBookingView } from "@/components/apprenant/appointment-booking-view";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ReservationPage() {
  const supabase = await getServerClient();
  if (!supabase) {
    return null;
  }

  // Récupérer l'ID du super admin contentin.cabinet@gmail.com
  const { data: contentinProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", "contentin.cabinet@gmail.com")
    .single();

  if (!contentinProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Service de réservation non disponible</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10 text-center">
          <h1 
            className="text-5xl font-semibold text-amber-900 mb-3"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
          >
            Jessica Contentin
          </h1>
          <p 
            className="text-xl text-amber-800/80"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
          >
            Professeure certifiée et psychopédagogue
          </p>
        </div>
        <AppointmentBookingView superAdminId={contentinProfile.id} />
      </div>
    </main>
  );
}

