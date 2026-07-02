"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { EdgePremiumNavbar } from "@/components/edge-site/premium/edge-premium-navbar";
import { EdgePremiumTopBar } from "@/components/edge-site/premium/edge-premium-top-bar";

type Props = {
  overlayNav?: boolean;
};

export function EdgePremiumFixedHeader({ overlayNav = true }: Props) {
  const [pageScrolled, setPageScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setPageScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solidChrome = pageScrolled || !overlayNav;

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300",
        solidChrome && "bg-edge-black-deep shadow-[0_1px_0_rgba(255,255,255,0.06)]",
      )}
    >
      <EdgePremiumTopBar solid={solidChrome} />
      <EdgePremiumNavbar overlay={overlayNav} pageScrolled={pageScrolled} />
    </div>
  );
}
