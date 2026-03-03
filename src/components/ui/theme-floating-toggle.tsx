"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function ThemeFloatingToggle() {
  const pathname = usePathname();
  const [hostname, setHostname] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHostname(window.location.hostname || "");
  }, []);

  const isJessicaSurface = useMemo(() => {
    const host = hostname.toLowerCase();
    const isJessicaHost =
      host.includes("jessicacontentin.fr") || host.includes("jessica-contentin.fr");
    const isJessicaPath =
      pathname?.startsWith("/jessica-contentin") ||
      pathname === "/consultations" ||
      pathname === "/a-propos" ||
      pathname === "/specialites" ||
      pathname?.startsWith("/specialites/") ||
      pathname === "/orientation" ||
      pathname === "/ressources" ||
      pathname?.startsWith("/ressources/") ||
      pathname === "/blog" ||
      pathname?.startsWith("/blog/");

    return Boolean(isJessicaHost || isJessicaPath);
  }, [hostname, pathname]);

  if (isJessicaSurface) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <ThemeToggle showLabel={false} />
    </div>
  );
}
