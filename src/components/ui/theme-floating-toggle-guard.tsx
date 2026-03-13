"use client";

import { usePathname } from "next/navigation";
import { ThemeFloatingToggle } from "@/components/ui/theme-floating-toggle";

export function ThemeFloatingToggleGuard() {
  const pathname = usePathname();

  if (pathname?.startsWith("/landing")) {
    return null;
  }

  return <ThemeFloatingToggle />;
}
