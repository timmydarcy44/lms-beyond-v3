export function BadgeDisplay() {
  return (
    <div
      className="mx-auto inline-flex max-w-sm flex-col border border-black/[0.06] bg-edge-grey p-8 text-left"
      role="img"
      aria-label="Open Badge IMS Global — certification vérifiable"
    >
      <div className="flex items-start gap-5">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-edge-red bg-white"
          aria-hidden
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 text-edge-red" fill="currentColor">
            <path d="M12 2L15 8.5L22 9.3L17 14L18.5 21L12 17.8L5.5 21L7 14L2 9.3L9 8.5L12 2Z" />
          </svg>
        </span>
        <div>
          <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">Open Badge</p>
          <p className="mt-1 text-base font-medium tracking-[-0.02em] text-edge-black">IMS Global</p>
          <p className="mt-2 text-[13px] leading-relaxed text-black/40">
            Métadonnées vérifiables · Émetteur EDGE Business School
          </p>
        </div>
      </div>
      <p className="mt-6 border-t border-black/[0.06] pt-4 font-mono text-[11px] text-black/25">
        badge.edgebs.fr/verify/…
      </p>
    </div>
  );
}
