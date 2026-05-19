"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppleSuccessCheck } from "@/components/edge-site/apple-success-check";
import { POSTULER_CONFIRMATION_STORAGE_KEY } from "@/lib/edge-site/postuler";
import { EDGE_HREFS } from "@/lib/edge-site/constants";

const STEPS = [
  "Tu reçois un email de confirmation dans quelques minutes",
  "Un membre de l'équipe EDGE te contacte pour un échange de 20 minutes",
  "On vérifie ensemble que le parcours est fait pour toi — sans pression",
] as const;

export function PostulerConfirmation() {
  const [email, setEmail] = useState<string | null>(null);
  const [prenom, setPrenom] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = sessionStorage.getItem(POSTULER_CONFIRMATION_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as { email?: string; prenom?: string };
        if (data.email) setEmail(data.email);
        if (data.prenom) setPrenom(data.prenom);
        sessionStorage.removeItem(POSTULER_CONFIRMATION_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-5 py-16 sm:px-10">
      <div className="w-full max-w-md text-center">
        {mounted ? <AppleSuccessCheck size={96} className="mx-auto" /> : <div className="mx-auto h-24 w-24" />}

        <h1 className="font-sf-pro-bold mt-10 text-[clamp(1.875rem,5vw,2.5rem)] leading-[1.1] tracking-tight text-edge-black">
          {prenom ? `${prenom}, c'est noté.` : "C'est noté."}
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-black/45">
          On te rappelle dans les 48h pour construire la suite avec toi.
        </p>
        {email ? <p className="mt-2 text-[15px] text-black/30">{email}</p> : null}

        <ul className="mt-12 space-y-0 overflow-hidden rounded-3xl bg-[#f5f5f7] text-left">
          {STEPS.map((step, i) => (
            <li
              key={step}
              className="flex gap-4 border-b border-black/[0.04] px-6 py-5 text-[15px] leading-relaxed text-edge-black last:border-0"
            >
              <span className="font-sf-pro-bold mt-0.5 w-5 shrink-0 text-[13px] text-black/25">
                {String(i + 1).padStart(2, "0")}
              </span>
              {step}
            </li>
          ))}
        </ul>

        <Link
          href={EDGE_HREFS.home}
          className="font-sf-pro-bold mt-12 inline-flex min-h-[48px] items-center justify-center rounded-full bg-edge-black px-10 text-[15px] text-white transition-opacity hover:opacity-85"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
