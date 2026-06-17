"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EDGE_HREFS } from "@/lib/edge-site/constants";

const STORAGE_KEY = "edge-orientation-banner-dismissed";

export function OrientationTopBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="relative z-[60] flex h-9 shrink-0 items-center justify-center bg-edge-black px-10 text-center text-[12px] text-white/70">
      <p>
        Pas sûr de votre parcours ? Test d&apos;orientation en 2 minutes{" "}
        <Link href={EDGE_HREFS.orientation} className="font-medium text-edge-red transition-opacity hover:opacity-80">
          → Faire le test
        </Link>
      </p>
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 px-2 text-white/40 transition-colors hover:text-white"
        aria-label="Fermer la bannière"
        onClick={() => {
          try {
            localStorage.setItem(STORAGE_KEY, "1");
          } catch {
            /* ignore */
          }
          setVisible(false);
        }}
      >
        ×
      </button>
    </div>
  );
}
