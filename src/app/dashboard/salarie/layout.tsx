import type { ReactNode } from "react";
import { JadeInternalFill } from "@/components/demo/jade-internal-fill";
import { SalarieConnectShell } from "@/components/salarie/salarie-connect-shell";

export default function SalarieLayout({ children }: { children: ReactNode }) {
  return (
    <SalarieConnectShell>
      <JadeInternalFill>{children}</JadeInternalFill>
    </SalarieConnectShell>
  );
}
