"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

type BeyondNoteSidebarItemProps = {
  href: string;
  isOpen: boolean;
  appearance?: "default" | "apple";
};

export function BeyondNoteSidebarItem({ href, isOpen, appearance = "default" }: BeyondNoteSidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname?.startsWith(href);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";
  const isApple = appearance === "apple";

  return (
    <Link href={href} title="Beyond Note" className="relative block">
      <div
        className={cn(
          "group flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isApple ? "rounded-[20px] border" : "rounded-lg border-2",
          isApple
            ? isActive
              ? "border-violet-500/45 bg-violet-500/25 text-white shadow-[0_40px_120px_-55px_rgba(109,40,217,0.55)]"
              : "border-violet-400/30 bg-white/8 text-white/85 shadow-[0_22px_65px_-55px_rgba(8,8,24,0.7)] backdrop-blur-xl hover:border-violet-400/45 hover:bg-violet-500/12 hover:text-white"
            : isLight
              ? isActive
                ? "bg-gradient-to-r from-violet-50 to-purple-100 text-violet-700 border-violet-400 shadow-sm"
                : "border-violet-300/50 text-slate-600 hover:bg-violet-50/50 hover:text-violet-600 hover:border-violet-400"
              : isActive
                ? "bg-gradient-to-r from-violet-500/20 to-purple-500/10 text-violet-400 border-violet-500/60 backdrop-blur-sm shadow-lg shadow-violet-500/20"
                : "border-violet-500/30 text-white/70 hover:bg-violet-500/10 hover:text-violet-400 hover:border-violet-500/50",
          !isOpen && "justify-center px-2",
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center transition-all",
            isApple
              ? isActive
                ? "h-10 w-10 flex-shrink-0 rounded-full border border-white/40 bg-white/18 text-white shadow-[0_22px_60px_-36px_rgba(109,40,217,0.5)]"
                : "h-10 w-10 flex-shrink-0 rounded-full border border-white/20 bg-white/10 text-white/80 shadow-[0_22px_60px_-44px_rgba(8,8,24,0.6)] group-hover:border-white/30 group-hover:bg-white/15 group-hover:text-white"
              : "h-5 w-5 flex-shrink-0",
          )}
        >
          <FileText
            className={cn(
              "transition-colors",
              isApple
                ? "h-4 w-4"
                : isLight
                  ? isActive
                    ? "h-5 w-5 text-violet-600"
                    : "h-5 w-5 text-violet-500 group-hover:text-violet-600"
                  : isActive
                    ? "h-5 w-5 text-violet-400"
                    : "h-5 w-5 text-violet-400/70 group-hover:text-violet-400",
            )}
          />
        </span>
        <span className={cn("transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")}>
          Beyond Note
        </span>
        {/* Badge premium */}
        {isOpen && (
          <span
            className={cn(
              "ml-auto px-2 py-0.5 text-xs font-semibold",
              isApple
                ? "rounded-full border border-white/20 bg-white/10 text-white/80"
                : "rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white",
            )}
          >
            Premium
          </span>
        )}
      </div>
    </Link>
  );
}








