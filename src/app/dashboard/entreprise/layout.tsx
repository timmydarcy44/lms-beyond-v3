import type { ReactNode } from "react";
import { EntrepriseFloatingAssistant } from "@/components/enterprise/entreprise-floating-assistant";

export default function EntrepriseDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <EntrepriseFloatingAssistant />
    </>
  );
}
