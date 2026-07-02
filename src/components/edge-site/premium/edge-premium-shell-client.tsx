"use client";

import { EdgePremiumConfigProvider } from "@/components/edge-site/premium/edge-premium-config-context";
import { EdgePremiumFixedHeader } from "@/components/edge-site/premium/edge-premium-fixed-header";
import { EdgePremiumFooter } from "@/components/edge-site/premium/edge-premium-footer";
import type { EdgePremiumConfig } from "@/lib/edge-site/premium-constants";

type Props = {
  children: React.ReactNode;
  config: EdgePremiumConfig;
  overlayNav?: boolean;
};

export function EdgePremiumShellClient({
  children,
  config,
  overlayNav = true,
}: Props) {
  return (
    <EdgePremiumConfigProvider config={config}>
      <div className="min-h-screen bg-edge-black-deep font-sans antialiased">
        <EdgePremiumFixedHeader overlayNav={overlayNav} />
        <main className={overlayNav ? undefined : "pt-16 lg:pt-[100px]"}>{children}</main>
        <EdgePremiumFooter />
      </div>
    </EdgePremiumConfigProvider>
  );
}
