import { headers } from "next/headers";
import { EdgePremiumShellClient } from "@/components/edge-site/premium/edge-premium-shell-client";
import { getEdgePremiumConfig } from "@/lib/edge-site/premium-constants";

type Props = {
  children: React.ReactNode;
  /** Navbar transparente sur la hero (accueil et pages marketing sombres). */
  overlayNav?: boolean;
  /** Chrome clair (fond blanc, textes/logo noirs) pour pages marketing claires. */
  navChrome?: "dark" | "light";
  /** Bandeau secondaire au-dessus de la navigation. */
  showTopBar?: boolean;
};

export async function EdgePremiumShell({
  children,
  overlayNav = true,
  navChrome = "dark",
  showTopBar = true,
}: Props) {
  const host = (await headers()).get("host");
  const config = getEdgePremiumConfig(host);

  return (
    <EdgePremiumShellClient
      config={config}
      overlayNav={overlayNav}
      navChrome={navChrome}
      showTopBar={showTopBar}
    >
      {children}
    </EdgePremiumShellClient>
  );
}
