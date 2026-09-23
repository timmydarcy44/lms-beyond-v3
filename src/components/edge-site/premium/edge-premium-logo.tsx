"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EDGE_LOGO_PATH } from "@/lib/edge-site/premium-constants";

type Props = {
  className?: string;
  href?: string;
  /** Logo teinté noir pour chrome clair. */
  light?: boolean;
};

export function EdgePremiumLogo({ className, href, light = false }: Props) {
  const { links } = useEdgePremiumConfig();
  const homeHref = href ?? links.home;

  return (
    <Link
      href={homeHref}
      className={cn("inline-flex shrink-0 items-center", className)}
      aria-label="Byound — Accueil"
    >
      <Image
        src={EDGE_LOGO_PATH}
        alt="Byound"
        width={120}
        height={32}
        className={cn("h-7 w-auto", light && "brightness-0")}
        priority
      />
    </Link>
  );
}
