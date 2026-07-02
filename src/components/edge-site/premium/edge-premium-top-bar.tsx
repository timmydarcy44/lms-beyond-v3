import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EDGE_MARKETING_ROUTES } from "@/lib/edge-site/marketing-routes";

type Props = {
  solid?: boolean;
};

export function EdgePremiumTopBar({ solid = false }: Props) {
  return (
    <div
      className={cn(
        "relative hidden border-b border-white/[0.04] lg:block",
        solid ? "bg-edge-black-deep" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-end px-5 sm:px-8 lg:px-10">
        <Link
          href={EDGE_MARKETING_ROUTES.formateursExperts}
          className="group inline-flex items-center gap-1.5 text-[13px] text-white/45 transition-colors hover:text-edge-accent"
        >
          <span>Vous êtes formateur ou expert métier ?</span>
          <span className="text-white/55 group-hover:text-edge-accent">Rejoignez EDGE</span>
          <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
        </Link>
      </div>
    </div>
  );
}
