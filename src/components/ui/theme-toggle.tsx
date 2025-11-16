"use client";

import { useEffect, useState } from "react";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  showLabel?: boolean;
};

export function ThemeToggle({ className, showLabel = true }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isLight = resolvedTheme === "light";
  const icon = isLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />;

  return (
    <Button
      type="button"
      variant={showLabel ? "outline" : "ghost"}
      size={showLabel ? "sm" : "icon"}
      className={cn(
        "rounded-full transition",
        showLabel
          ? "flex items-center gap-2 border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em]"
          : "h-10 w-10 justify-center border",
        isLight
          ? showLabel
            ? "border-slate-300 bg-white/80 text-slate-700 hover:bg-slate-100"
            : "border-slate-200 bg-white/90 text-slate-700 hover:bg-slate-100"
          : showLabel
            ? "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
            : "border-white/15 bg-white/5 text-white hover:bg-white/15",
        className,
      )}
      onClick={() => setTheme(isLight ? "dark" : "light")}
      aria-label={isLight ? "Activer le mode sombre" : "Activer le mode clair"}
    >
      {icon}
      {showLabel ? (isLight ? "Mode clair" : "Mode sombre") : null}
    </Button>
  );
}




