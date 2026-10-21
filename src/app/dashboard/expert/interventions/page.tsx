import { MissionsView } from "@/components/expert/space/missions-view";
import { loadExpertSpace } from "@/lib/expert/space-server";

export const dynamic = "force-dynamic";

export default async function ExpertInterventionsPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>;
}) {
  const params = await searchParams;
  const filter = params.f === "terminees" || params.f === "toutes" ? params.f : "avenir";
  const space = await loadExpertSpace();
  return <MissionsView missions={space.missions} filter={filter} />;
}
