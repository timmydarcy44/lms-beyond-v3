import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { AgendaView } from "@/components/super-admin/agenda/agenda-view";
import { GoogleCalendarConnectPanel } from "@/components/jessica-contentin/super/google-calendar-connect";
import { JessicaSuperPage } from "@/components/jessica-contentin/super/jessica-super-ui";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SuperAdminAgendaPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).single();
  if (profile?.email !== "contentin.cabinet@gmail.com") redirect("/super");

  const service = getServiceRoleClient();
  const { data: googleConn } = service
    ? await service
        .from("jessica_google_calendar_connections")
        .select("last_synced_at")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <JessicaSuperPage
      title="Agenda"
      subtitle="Plages horaires, réservations et synchronisation Google Calendar (75€/h comptabilisés)."
    >
      <Suspense fallback={null}>
        <GoogleCalendarConnectPanel
          connected={Boolean(googleConn)}
          lastSyncedAt={googleConn?.last_synced_at ? String(googleConn.last_synced_at) : null}
        />
      </Suspense>
      <AgendaView superAdminId={user.id} />
    </JessicaSuperPage>
  );
}
