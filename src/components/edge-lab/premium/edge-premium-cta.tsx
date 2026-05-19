"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Base = {
  children: React.ReactNode;
  className?: string;
};

export function EdgeGlowButton({ href, children, className }: Base & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative inline-flex min-h-[48px] items-center justify-center overflow-hidden rounded-full px-8 text-sm font-semibold text-[#06060a] transition duration-300",
        "bg-[#f4f4f5] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_48px_-12px_rgba(190,244,100,0.42),0_0_72px_-20px_rgba(190,244,100,0.18)]",
        "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_0_56px_-8px_rgba(190,244,100,0.55),0_0_88px_-16px_rgba(190,244,100,0.28)]",
        "hover:bg-white",
        className,
      )}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-lime-300/0 via-white/30 to-lime-300/0 opacity-0 transition duration-500 group-hover:opacity-100" />
      <span className="relative">{children}</span>
    </Link>
  );
}

export function EdgeGhostButton({ href, children, className }: Base & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-8 text-sm font-medium text-white/85 backdrop-blur-sm transition",
        "hover:border-white/25 hover:bg-white/[0.08] hover:text-white",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function EdgeSolidDarkButton({ href, children, className }: Base & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-8 text-sm font-semibold text-white transition",
        "hover:border-lime-300/35 hover:bg-white/[0.1] hover:shadow-[0_0_40px_-12px_rgba(190,244,100,0.28)]",
        className,
      )}
    >
      {children}
    </Link>
  );
}
