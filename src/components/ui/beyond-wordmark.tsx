"use client";

import { cn } from "@/lib/utils";

type BeyondWordmarkProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses: Record<NonNullable<BeyondWordmarkProps["size"]>, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
};

export function BeyondWordmark({ className, size = "md" }: BeyondWordmarkProps) {
  return (
    <span
      className={cn(
        "font-semibold tracking-tight",
        sizeClasses[size],
        className,
      )}
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
      }}
    >
      Beyond
    </span>
  );
}


