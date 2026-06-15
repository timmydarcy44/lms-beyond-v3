"use client";

import { cn } from "@/lib/utils";
import { JessicaRemoteImage } from "@/components/jessica-contentin/jessica-remote-image";

type IphoneMockupProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

export function IphoneMockup({ src, alt, className, priority }: IphoneMockupProps) {
  return (
    <div className={cn("relative mx-auto w-[min(100%,280px)]", className)}>
      <div className="relative rounded-[3rem] border-[4px] border-[#111] bg-[#111] p-[11px] shadow-[0_40px_80px_-28px_rgba(15,23,42,0.55)]">
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
