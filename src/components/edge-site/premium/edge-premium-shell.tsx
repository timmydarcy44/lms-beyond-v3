import { EdgePremiumFixedHeader } from "@/components/edge-site/premium/edge-premium-fixed-header";
import { EdgePremiumFooter } from "@/components/edge-site/premium/edge-premium-footer";

type Props = {
  children: React.ReactNode;
  /** Navbar transparente sur la hero (accueil et pages marketing sombres). */
  overlayNav?: boolean;
};

export function EdgePremiumShell({ children, overlayNav = true }: Props) {
  return (
    <div className="min-h-screen bg-edge-black-deep font-sans antialiased">
      <EdgePremiumFixedHeader overlayNav={overlayNav} />
      <main className={overlayNav ? undefined : "pt-16 lg:pt-[100px]"}>{children}</main>
      <EdgePremiumFooter />
    </div>
  );
}
