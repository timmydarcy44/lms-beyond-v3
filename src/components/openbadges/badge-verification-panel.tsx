"use client";

import { useEffect, useRef, useState } from "react";
import { truncateBadgeId } from "@/lib/openbadges/v3/badge-page-display";

type Props = {
  signature: string;
  status: string;
  issued: string;
  assertionId: string;
  pngUrl: string;
  jwtUrl: string;
  jsonUrl: string;
};

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const field = document.createElement("textarea");
    field.value = value;
    document.body.appendChild(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  }
}

export function BadgeVerificationPanel({ signature, status, issued, assertionId, pngUrl, jwtUrl, jsonUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const rows = [
    ["Signature", signature],
    ["Statut", status],
    ["Émis le", issued],
    ["Standard", "Open Badges 3.0"],
  ] as const;

  return (
    <section id="verification" className="rounded-3xl border border-white/10 bg-[#101117] p-6">
      <h2 className="text-xl font-bold tracking-[-0.04em]">Vérification</h2>
      <dl className="mt-4 space-y-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-[rgba(242,242,244,0.5)]">{label}</dt>
            <dd className="text-right">{value}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4">
          <dt className="text-[rgba(242,242,244,0.5)]">Identifiant</dt>
          <dd className="flex items-center gap-2">
            <span>{truncateBadgeId(assertionId)}</span>
            <button
              type="button"
              className="text-xs text-[#A99BFF]"
              onClick={() => {
                void copyText(assertionId).then(() => setCopied(true));
              }}
            >
              {copied ? "Copié" : "Copier"}
            </button>
          </dd>
        </div>
      </dl>
      <a className="mt-5 block rounded-full bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#050608]" href={pngUrl}>
        Télécharger le badge (PNG signé)
      </a>
      <div ref={menuRef} className="relative mt-3 text-center">
        <button type="button" className="text-sm text-[rgba(242,242,244,0.55)]" onClick={() => setOpen((value) => !value)}>
          Autres formats
        </button>
        {open ? (
          <div className="absolute left-1/2 z-10 mt-2 w-44 -translate-x-1/2 rounded-2xl border border-white/10 bg-[#171820] p-1 text-left text-sm shadow-xl">
            <a className="block rounded-xl px-3 py-2 hover:bg-white/5" href={jwtUrl}>credential JWT</a>
            <a className="block rounded-xl px-3 py-2 hover:bg-white/5" href={jsonUrl}>JSON</a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
