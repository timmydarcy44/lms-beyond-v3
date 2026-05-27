"use client";

import type { ReactNode } from "react";

import { TextReveal } from "@/components/beyond-studio/motion/cinematic";
import { studioLightMuted, studioLightSubtle } from "@/components/beyond-studio/theme";
import { cn } from "@/lib/utils";

type CampaignHeadlineProps = {
  title: ReactNode;
  subtext?: string;
  theme?: "dark" | "light";
  align?: "left" | "center";
  size?: "lg" | "xl";
  className?: string;
};

export function CampaignHeadline({
  title,
  subtext,
  theme = "dark",
  align = "left",
  size = "xl",
  className,
}: CampaignHeadlineProps) {
  const light = theme === "light";

  return (
    <div
      className={cn(
        align === "center" && "mx-auto max-w-4xl text-center",
        className,
      )}
    >
      <TextReveal>
        <h2
          className={cn(
            "font-semibold tracking-[-0.045em]",
            size === "xl"
              ? "text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.98]"
              : "text-[clamp(2rem,5vw,3.75rem)] leading-[1.02]",
            light ? studioLightSubtle : "text-white",
          )}
        >
          {title}
        </h2>
      </TextReveal>
      {subtext ? (
        <TextReveal delay={0.12}>
          <p
            className={cn(
              "mt-6 max-w-xl text-lg leading-relaxed sm:text-xl",
              align === "center" && "mx-auto",
              light ? studioLightMuted : "text-zinc-500",
            )}
          >
            {subtext}
          </p>
        </TextReveal>
      ) : null}
    </div>
  );
}
