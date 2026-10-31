"use client";

import { useState } from "react";

type Props = {
  pdfUrl: string;
  pageUrl: string;
};

export function BadgePublicActions({ pdfUrl, pageUrl }: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
      <a
        href={pdfUrl}
        className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#050608] sm:w-auto"
      >
        Certificat PDF
      </a>
      <button
        type="button"
        className="inline-flex w-full items-center justify-center rounded-full bg-[#2C2D36] px-5 py-3 text-sm font-semibold text-[#F2F2F4] sm:w-auto"
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
