import { EdgePremiumFooter } from "@/components/edge-site/premium/edge-premium-footer";
import { EdgePremiumNavbar } from "@/components/edge-site/premium/edge-premium-navbar";
import { EdgePremiumTopBar } from "@/components/edge-site/premium/edge-premium-top-bar";

type Props = {
  children: React.ReactNode;
  /** Navbar transparente sur la hero (accueil et pages marketing sombres). */
  overlayNav?: boolean;
};

export function EdgePremiumShell({ children, overlayNav = true }: Props) {
  return (
    <div className="min-h-screen bg-edge-black-deep font-sans antialiased">
      <div className="fixed inset-x-0 top-0 z-50">
        <EdgePremiumTopBar />
        <EdgePremiumNavbar overlay={overlayNav} />
      </div>
      <main className={overlayNav ? undefined : "pt-16 lg:pt-[100px]"}>{children}</main>
      <EdgePremiumFooter />
    </div>
  );
}
