import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  screenClassName?: string;
};

/** MacBook Pro — cadre marketing pour aperçus produit (EDGE × nevo, etc.). */
export function EdgeMacbookMockup({ children, className, screenClassName }: Props) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[920px]", className)}>
      <div className="relative" style={{ transform: "perspective(1400px) rotateX(2deg)" }}>
        <div className="relative overflow-hidden rounded-t-[18px] bg-[#2d2d2d] px-3 pb-1.5 pt-2.5 shadow-[0_40px_100px_-40px_rgba(0,0,0,0.75)] ring-1 ring-white/10">
          <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-lg bg-[#2d2d2d]">
            <div className="absolute left-1/2 top-1 h-1 w-12 -translate-x-1/2 rounded-full bg-black/50" />
          </div>
          <div className="relative z-20 flex gap-1.5 pt-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28ca42]" />
          </div>
          <div
            className={cn(
              "relative mt-2 aspect-[16/10] overflow-hidden rounded-[6px] bg-[#0a0a0a] ring-1 ring-black/60",
              screenClassName,
            )}
          >
            {children}
          </div>
        </div>

        <div className="relative mx-10 h-1 bg-gradient-to-b from-[#3a3a3a] to-[#1a1a1a]" />

        <div className="relative h-5 rounded-b-[18px] bg-gradient-to-b from-[#2d2d2d] to-[#151515] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
          <div className="absolute left-1/2 top-0 h-3 w-24 -translate-x-1/2 rounded-b-md bg-gradient-to-b from-[#3a3a3a] to-[#222]" />
        </div>
      </div>
    </div>
  );
}

type ImageScreenProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

export function EdgeMacbookImageScreen({ src, alt, className, priority }: ImageScreenProps) {
  return (
    <EdgeMacbookMockup className={className}>
      <Image src={src} alt={alt} fill className="object-cover object-top" sizes="920px" priority={priority} />
    </EdgeMacbookMockup>
  );
}
