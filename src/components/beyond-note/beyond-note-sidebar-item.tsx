"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

type BeyondNoteSidebarItemProps = {
  href: string;
  isOpen: boolean;
};

export function BeyondNoteSidebarItem({ href, isOpen }: BeyondNoteSidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname?.startsWith(href);
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  return (
    <Link href={href} title="Beyond Note" className="relative">
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          // Style premium avec bordure et couleur violet/purple
          "border-2",
          isLight
            ? isActive
              ? "bg-gradient-to-r from-violet-50 to-purple-100 text-violet-700 border-violet-400 shadow-sm"
              : "border-violet-300/50 text-slate-600 hover:bg-violet-50/50 hover:text-violet-600 hover:border-violet-400"
            : isActive
              ? "bg-gradient-to-r from-violet-500/20 to-purple-500/10 text-violet-400 border-violet-500/60 backdrop-blur-sm shadow-lg shadow-violet-500/20"
              : "border-violet-500/30 text-white/70 hover:bg-violet-500/10 hover:text-violet-400 hover:border-violet-500/50",
          !isOpen && "justify-center px-0 border-2",
        )}
      >
        <FileText
          className={cn(
            "h-5 w-5 shrink-0 transition-colors",
            isLight
              ? isActive
                ? "text-violet-600"
                : "text-violet-500 group-hover:text-violet-600"
              : isActive
                ? "text-violet-400"
                : "text-violet-400/70 group-hover:text-violet-400",
          )}
        />
        <span className={cn("transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0 pointer-events-none")}>
          Beyond Note
        </span>
        {/* Badge premium */}
        {isOpen && (
          <span className="ml-auto rounded-full bg-gradient-to-r from-violet-500 to-purple-500 px-2 py-0.5 text-xs font-semibold text-white">
            Premium
          </span>
        )}
      </div>
    </Link>
  );
}



