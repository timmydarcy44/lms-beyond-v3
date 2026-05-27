"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";

const PAYMENT_URL =
  typeof process.env.NEXT_PUBLIC_SOFT_SKILLS_PAYMENT_URL === "string"
    ? process.env.NEXT_PUBLIC_SOFT_SKILLS_PAYMENT_URL.trim()
    : "";

export default function SoftSkillsPaymentPage() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (PAYMENT_URL) {
      window.location.href = PAYMENT_URL;
      return;
    }
    setChecking(false);
  }, []);

  if (checking && PAYMENT_URL) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-black/60">
        Redirection vers le paiement…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-8">
      <div className="space-y-2">
        <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-[#FF3B30]">
          Test des soft skills
        </p>
        <h1 className="text-2xl font-medium text-[#0a0a0a]">Lien de paiement</h1>
        <p className="text-sm text-black/60">
          Le parcours Soft Skills sera accessible après règlement. Le lien de paiement sera
          configuré prochainement par l&apos;équipe EDGE.
        </p>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <strong>Configuration à venir.</strong> Une fois le lien Stripe (ou autre) défini, il sera
        branché via la variable d&apos;environnement{" "}
        <code className="rounded bg-white/80 px-1 text-xs">NEXT_PUBLIC_SOFT_SKILLS_PAYMENT_URL</code>{" "}
        sur le serveur.
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/apprenant" className={CONNECT_BTN_SECONDARY}>
          Retour au dashboard
        </Link>
        <Link href="/dashboard/apprenant/soft-skills-intro" className={CONNECT_BTN_PRIMARY}>
          Page d&apos;introduction
        </Link>
      </div>
    </div>
  );
}
