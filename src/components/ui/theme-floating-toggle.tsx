"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";

export function ThemeFloatingToggle() {
  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <ThemeToggle showLabel={false} />
    </div>
  );
}
