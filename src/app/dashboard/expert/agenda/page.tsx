import { AgendaView, type AgendaPatient } from "@/components/expert/space/agenda-view";
import { getSession } from "@/lib/auth/session";
import { loadExpertSpace } from "@/lib/expert/space-server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ExpertAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const space = await loadExpertSpace();
  const session = await getSession();
  const db = await getServerClient();
  let patients: AgendaPatient[] = [];
  if (session?.id && db) {
    const listed = await db.from("expert_care_clients").select("id,first_name,last_name,email").eq("expert_id", session.id).order("last_name");
    if (!listed.error) patients = (listed.data ?? []) as AgendaPatient[];
  }

  return (
    <AgendaView
      slots={space.slots}
      format={space.format}
      noticeHours={space.noticeHours}
      patients={patients}
      presetClientId={client || null}
    />
  );
}
