import { CareFicheEditor } from "@/components/expert/care-fiche-editor";
import { loadCareExpertWorkspace } from "@/lib/care/expert-workspace";

export const dynamic = "force-dynamic";

export default async function CareFichePage() {
  const workspace = await loadCareExpertWorkspace();
  return <CareFicheEditor profile={workspace.profile} />;
}
