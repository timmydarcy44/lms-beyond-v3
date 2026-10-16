import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { HomePage } from "@/components/home/home-page";

export function EdgePremiumHome() {
  return (
    <EdgePremiumShell overlayNav showTopBar={false} showFooter={false}>
      <HomePage />
    </EdgePremiumShell>
  );
}
