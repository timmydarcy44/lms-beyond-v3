import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { EDGE_HREFS } from "@/lib/edge-site/constants";
import { EDGE_LOGO_PATH } from "@/lib/edge-site/premium-constants";

type Props = {
  className?: string;
  href?: string;
};

export function EdgePremiumLogo({ className, href = EDGE_HREFS.home }: Props) {
  return (
    <Link
      href={href}
      className={cn("inline-flex shrink-0 items-center", className)}
      aria-label="EDGE — Accueil"
    >
      <Image
        src={EDGE_LOGO_PATH}
        alt="EDGE"
        width={88}
        height={28}
        className="h-7 w-auto"
        priority
      />
    </Link>
  );
}
