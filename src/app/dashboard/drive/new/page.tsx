import { DashboardShell } from "@/components/dashboard/dashboard-shell";

import DriveEditor from "./drive-editor";

export default function NewDriveDocumentPage() {
  return (
    <DashboardShell
      title="Nouveau document"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/apprenant" },
        { label: "Drive", href: "/dashboard/drive" },
        { label: "Nouveau document" },
      ]}
    >
      <DriveEditor />
    </DashboardShell>
  );
}










