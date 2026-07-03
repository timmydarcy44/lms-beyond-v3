import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
};

const paddingMap = {
  sm: "p-5",
  md: "p-6",
  lg: "p-8",
};

export function EdgeCard({ children, className, hover = false, padding = "md" }: Props) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[#050505]/8 bg-white shadow-[0_1px_2px_rgba(5,5,5,0.04),0_8px_32px_rgba(5,5,5,0.06)]",
        paddingMap[padding],
        hover && "transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(99,91,255,0.10)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
