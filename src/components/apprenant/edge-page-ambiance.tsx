"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Ambiance de page EDGE — peinte sur le MAIN shell (background continu),
 * JAMAIS comme une card / grand rectangle arrondi.
 */
export type EdgeAmbiance = "profile" | "evolution" | "mission" | "neutral" | "care" | "skills";

const AMBIANCE: Record<EdgeAmbiance, string> = {
  profile:
    "radial-gradient(ellipse 120% 80% at 10% -10%, rgba(37,99,235,0.28), transparent 55%), radial-gradient(ellipse 90% 70% at 95% 10%, rgba(99,102,241,0.14), transparent 50%), transparent",
  evolution:
    "radial-gradient(ellipse 110% 75% at 85% -5%, rgba(124,58,237,0.22), transparent 55%), radial-gradient(ellipse 80% 60% at 0% 30%, rgba(14,165,233,0.12), transparent 50%), transparent",
  mission:
    "radial-gradient(ellipse 100% 70% at 50% -20%, rgba(30,41,59,0.4), transparent 55%), transparent",
  neutral:
    "radial-gradient(ellipse 100% 80% at 50% -15%, rgba(51,65,85,0.2), transparent 50%), transparent",
  care: "linear-gradient(165deg, #C70059 0%, #E83A7A 18%, #F472B6 38%, #FBCFE8 58%, #FFF5F9 78%, #FFFFFF 100%)",
  skills:
    "radial-gradient(ellipse 130% 90% at 0% -20%, rgba(61,123,255,0.32), transparent 52%), radial-gradient(ellipse 70% 55% at 100% 5%, rgba(14,165,233,0.16), transparent 48%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(37,99,235,0.1), transparent 55%), transparent",
};

export function EdgePageAmbiance({
  ambiance,
  children,
  className,
}: {
  ambiance: EdgeAmbiance;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    const main = document.querySelector<HTMLElement>("[data-connect-main]");
    const shell = document.querySelector<HTMLElement>('[data-connect-shell="edge"]');
    const backdrop = document.querySelector<HTMLElement>("[data-connect-backdrop]");

    if (main) {
      main.setAttribute("data-edge-ambiance", ambiance);
      main.style.setProperty("--edge-page-ambiance", AMBIANCE[ambiance]);
    }
    if (shell) {
      shell.setAttribute("data-edge-ambiance", ambiance);
      shell.style.setProperty("--edge-page-ambiance", AMBIANCE[ambiance]);
      if (ambiance === "care") {
        shell.style.background = AMBIANCE.care;
      }
    }
    if (backdrop) {
      if (ambiance === "care") {
        backdrop.style.display = "none";
      } else {
        backdrop.style.display = "";
      }
    }

    return () => {
      if (main?.getAttribute("data-edge-ambiance") === ambiance) {
        main.removeAttribute("data-edge-ambiance");
        main.style.removeProperty("--edge-page-ambiance");
      }
      if (shell?.getAttribute("data-edge-ambiance") === ambiance) {
        shell.removeAttribute("data-edge-ambiance");
        shell.style.removeProperty("--edge-page-ambiance");
        shell.style.background = "";
      }
      if (backdrop && ambiance === "care") {
        backdrop.style.display = "";
      }
    };
  }, [ambiance]);

  return (
    <div className={cn("relative", className)}>
      {ambiance === "care" ? (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{ background: AMBIANCE.care }}
        />
      ) : null}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
