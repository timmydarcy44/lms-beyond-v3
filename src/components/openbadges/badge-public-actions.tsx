"use client";

import { useState } from "react";

type Props = {
  linkedInUrl: string;
  pdfUrl: string;
  pageUrl: string;
};

export function BadgePublicActions({ linkedInUrl, pdfUrl, pageUrl }: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
      <a
        href={linkedInUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center rounded-full bg-[#6E5BFF] px-5 py-3 text-sm font-semibold text-white"
      >
        Ajouter à LinkedIn
      </a>
      <a
        href={pdfUrl}
        className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
      >
        Certificat PDF
      </a>
      <button
        type="button"
        className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(pageUrl);
          } catch {
            const field = document.createElement("textarea");
            field.value = pageUrl;
            document.body.appendChild(field);
            field.select();
            document.execCommand("copy");
            field.remove();
          }
          setCopied(true);
        }}
      >
        {copied ? "Lien copié" : "Copier le lien"}
      </button>
    </div>
  );
}
