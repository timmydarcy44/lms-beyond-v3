import { CareAvailabilityEditor } from "@/components/expert/care-availability-editor";
import { loadCareExpertWorkspace } from "@/lib/care/expert-workspace";

export const dynamic = "force-dynamic";

export default async function CareDisponibilitesPage() {
  const workspace = await loadCareExpertWorkspace();
  return <CareAvailabilityEditor rules={workspace.rules} exceptions={workspace.exceptions} />;
}
