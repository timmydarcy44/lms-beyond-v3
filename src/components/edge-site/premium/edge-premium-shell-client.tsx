"use client";

import { EdgePremiumConfigProvider } from "@/components/edge-site/premium/edge-premium-config-context";
import { EdgePremiumFixedHeader } from "@/components/edge-site/premium/edge-premium-fixed-header";
import { EdgePremiumFooter } from "@/components/edge-site/premium/edge-premium-footer";
import type { EdgePremiumConfig } from "@/lib/edge-site/premium-constants";

type Props = {
  children: React.ReactNode;
  config: EdgePremiumConfig;
  overlayNav?: boolean;
  navChrome?: "dark" | "light";
  showTopBar?: boolean;
  showFooter?: boolean;
};

export function EdgePremiumShellClient({
  children,
  config,
  overlayNav = true,
  navChrome = "dark",
  showTopBar = true,
  showFooter = true,
}: Props) {
  return (
    <EdgePremiumConfigProvider config={config}>
      <div
        className={
          navChrome === "light"
            ? "min-h-screen bg-white font-sans antialiased"
            : "min-h-screen bg-[#070b1f] font-sans antialiased"
        }
      >
        <EdgePremiumFixedHeader
          overlayNav={overlayNav}
          navChrome={navChrome}
          showTopBar={showTopBar}
        />
        <main className={overlayNav ? undefined : "pt-16 lg:pt-[100px]"}>{children}</main>
        {showFooter ? <EdgePremiumFooter /> : null}
      </div>
    </EdgePremiumConfigProvider>
  );
}
