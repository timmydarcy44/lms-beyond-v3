"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";

type Props = {
  solid?: boolean;
  light?: boolean;
};

export function EdgePremiumTopBar({ solid = false, light = false }: Props) {
  const { routes } = useEdgePremiumConfig();

  return (
    <div
      className={cn(
        "relative hidden lg:block",
        light
          ? cn("border-b border-black/[0.06]", solid ? "bg-white" : "bg-transparent")
          : cn("border-b border-white/[0.04]", solid ? "bg-edge-black-deep" : "bg-transparent"),
      )}
    >
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-end px-5 sm:px-8 lg:px-10">
        <Link
          href={routes.formateursExperts}
          className={cn(
            "group inline-flex items-center gap-1.5 text-[13px] transition-colors",
            light
              ? "text-neutral-500 hover:text-neutral-950"
              : "text-white/45 hover:text-white",
          )}
        >
          <span>Vous êtes formateur ou expert métier ?</span>
          <span
            className={cn(
              light
                ? "text-neutral-700 group-hover:text-neutral-950"
                : "text-white/55 group-hover:text-white",
            )}
          >
            Rejoignez EDGE
          </span>
          <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
        </Link>
      </div>
    </div>
  );
}
