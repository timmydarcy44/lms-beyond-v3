import { headers } from "next/headers";
import { EdgePremiumShellClient } from "@/components/edge-site/premium/edge-premium-shell-client";
import { getEdgePremiumConfig } from "@/lib/edge-site/premium-constants";

type Props = {
  children: React.ReactNode;
  /** Navbar transparente sur la hero (accueil et pages marketing sombres). */
  overlayNav?: boolean;
};

export async function EdgePremiumShell({ children, overlayNav = true }: Props) {
  const host = (await headers()).get("host");
  const config = getEdgePremiumConfig(host);

  return (
    <EdgePremiumShellClient config={config} overlayNav={overlayNav}>
      {children}
    </EdgePremiumShellClient>
  );
}
