"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { EdgePremiumNavbar } from "@/components/edge-site/premium/edge-premium-navbar";
import { EdgePremiumTopBar } from "@/components/edge-site/premium/edge-premium-top-bar";

type Props = {
  overlayNav?: boolean;
  navChrome?: "dark" | "light";
  showTopBar?: boolean;
};

export function EdgePremiumFixedHeader({
  overlayNav = true,
  navChrome = "dark",
  showTopBar = true,
}: Props) {
  const [pageScrolled, setPageScrolled] = useState(false);
  const light = navChrome === "light";

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
        solidChrome &&
          (light
            ? "bg-white shadow-[0_1px_0_rgba(0,0,0,0.06)]"
            : "bg-[#070b1f] shadow-[0_1px_0_rgba(255,255,255,0.06)]"),
      )}
    >
      {showTopBar ? <EdgePremiumTopBar solid={solidChrome} light={light} /> : null}
      <EdgePremiumNavbar overlay={overlayNav} pageScrolled={pageScrolled} light={light} />
    </div>
  );
}
