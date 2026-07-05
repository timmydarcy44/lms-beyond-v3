"use client";

import { cn } from "@/lib/utils";
import { JessicaRemoteImage } from "@/components/jessica-contentin/jessica-remote-image";

type IphoneMockupProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  /** Effets halo, verre et ombre renforcés (page produit NEVO) */
  premium?: boolean;
};

export function IphoneMockup({ src, alt, className, priority, premium }: IphoneMockupProps) {
  return (
    <div className={cn("relative mx-auto w-[min(100%,280px)]", className)}>
      {premium ? (
        <div
          className="pointer-events-none absolute -inset-6 rounded-[4rem] bg-[radial-gradient(ellipse_at_50%_50%,rgba(198,166,100,0.22),transparent_70%)]"
          aria-hidden
        />
      ) : null}

      <div
        className={cn(
          "relative rounded-[3rem] border-[4px] border-[#111] bg-[#111] p-[11px]",
          premium
            ? "shadow-[0_48px_100px_-24px_rgba(47,42,37,0.45),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
            : "shadow-[0_40px_80px_-28px_rgba(15,23,42,0.55)]",
        )}
      >
        {premium ? (
          <div
            className="pointer-events-none absolute inset-x-[14%] top-[6%] z-30 h-[38%] rounded-t-[2rem] bg-gradient-to-b from-white/25 to-transparent"
            aria-hidden
          />
        ) : null}

        <div className="pointer-events-none absolute left-1/2 top-[16px] z-20 h-[24px] w-[104px] -translate-x-1/2 rounded-full bg-[#111]" />

        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2.35rem] bg-[#F5F0E8]">
          <JessicaRemoteImage
            src={src}
            alt={alt}
            fill
            priority={priority}
            className="object-cover object-top"
          />
        </div>

        <div className="pointer-events-none absolute bottom-[20px] left-1/2 z-20 h-[5px] w-[108px] -translate-x-1/2 rounded-full bg-white/85" />
      </div>
    </div>
  );
}
