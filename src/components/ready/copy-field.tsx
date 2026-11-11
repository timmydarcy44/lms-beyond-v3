"use client";

import { useState } from "react";

type Props = {
  label: string;
  displayValue: string;
  copyValue: string;
  prepared?: boolean;
};

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallthrough */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function CopyField({ label, displayValue, copyValue, prepared = true }: Props) {
  const [copied, setCopied] = useState(false);
  const canCopy = Boolean(copyValue?.trim());

  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3"
      style={{ background: "var(--ready-tile)", borderRadius: 22 }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full"
            style={
              prepared
                ? { background: "var(--ready-gradient)" }
                : { background: "#fff" }
            }
            aria-hidden
          />
          <p className="text-[12px]" style={{ color: "var(--ready-muted)" }}>
            {label}
          </p>
        </div>
        <p className="mt-1 truncate text-[15px] font-semibold tracking-[-0.02em] text-white">
          {displayValue || "—"}
        </p>
      </div>
      <button
        type="button"
        disabled={!canCopy}
        aria-label={`Copier ${label}`}
        onClick={async () => {
          if (!canCopy) return;
          const ok = await writeClipboard(copyValue);
          if (ok) {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          }
        }}
        className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold disabled:opacity-40"
        style={
          copied
            ? { background: "var(--ready-gradient)", color: "#fff" }
            : { background: "rgba(255,255,255,0.08)", color: "#fff" }
        }
      >
        {copied ? "Copié ✓" : "Copier"}
      </button>
    </div>
  );
}
