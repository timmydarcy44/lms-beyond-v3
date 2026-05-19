"use client";

import { useEffect, useState } from "react";
import { EdgeButton } from "@/components/edge-site/edge-button";
import { EDGE_CTA_LABELS, EDGE_HREFS } from "@/lib/edge-site/constants";

type Props = {
  titre: string;
  parcoursSlug: string;
};

export function CTAStickyBottom({ titre, parcoursSlug }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 200);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-edge-black px-5 py-3 sm:px-10"
      role="region"
      aria-label="Candidature"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <p className="truncate text-sm text-white">{titre}</p>
        <EdgeButton
          href={EDGE_HREFS.postuler(parcoursSlug)}
          className="shrink-0 !py-2 !text-xs"
          ariaLabel={EDGE_CTA_LABELS.apply}
        >
          {EDGE_CTA_LABELS.apply}
        </EdgeButton>
      </div>
    </div>
  );
}
