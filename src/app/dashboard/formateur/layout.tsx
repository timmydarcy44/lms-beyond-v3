import "@/styles/edge-connect.css";

import { FormateurConnectShell } from "@/components/formateur/formateur-connect-shell";

export default function FormateurDashboardLayout({ children }: { children: React.ReactNode }) {
  return <FormateurConnectShell>{children}</FormateurConnectShell>;
}
