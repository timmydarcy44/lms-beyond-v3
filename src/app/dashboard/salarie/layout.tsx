import type { ReactNode } from "react";
import { SalarieConnectShell } from "@/components/salarie/salarie-connect-shell";

export default function SalarieLayout({ children }: { children: ReactNode }) {
  return <SalarieConnectShell>{children}</SalarieConnectShell>;
}
