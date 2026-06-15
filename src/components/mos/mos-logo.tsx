import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg" | "header";
};

const sizes = {
  sm: { box: "h-10 w-8" },
  md: { box: "h-14 w-11" },
  lg: { box: "h-16 w-12" },
  header: { box: "h-[88px] w-[72px] sm:h-[100px] sm:w-[82px] lg:h-[112px] lg:w-[92px]" },
};

export function MosLogo({ className, size = "md" }: Props) {
  const s = sizes[size];

  return (
    <div className={cn("relative shrink-0 overflow-visible bg-transparent", s.box, className)}>
      <Image
        src="/mos/logo.png"
        alt="MOS Caen — Maladrerie OmniSports"
        fill
        className="object-contain object-center"
        sizes="120px"
        priority
        unoptimized
      />
    </div>
  );
}
