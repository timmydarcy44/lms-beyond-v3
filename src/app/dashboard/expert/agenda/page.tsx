import { AgendaView } from "@/components/expert/space/agenda-view";
import { loadExpertSpace } from "@/lib/expert/space-server";

export const dynamic = "force-dynamic";

export default async function ExpertAgendaPage() {
  const space = await loadExpertSpace();
  return <AgendaView slots={space.slots} format={space.format} noticeHours={space.noticeHours} />;
}
