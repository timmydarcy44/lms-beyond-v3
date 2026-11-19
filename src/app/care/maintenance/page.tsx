import type { Metadata } from "next";
import Image from "next/image";

import { CARE_LOGO_URL } from "@/lib/expert/care-email";

export const metadata: Metadata = {
  title: "Maintenance",
  description: "Byound Care est temporairement en maintenance.",
  robots: { index: false, follow: false },
};

export default function CareMaintenancePage() {
  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#0b1533] px-6 py-16 text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(194,24,91,.28),transparent_42%),radial-gradient(ellipse_at_85%_80%,rgba(59,79,184,.22),transparent_46%)]"
        aria-hidden
      />
      <div className="relative mx-auto w-full max-w-xl text-center">
        <Image
          src={CARE_LOGO_URL}
          alt="Byound Care"
          width={72}
          height={72}
          className="mx-auto h-[72px] w-[72px] object-contain"
          priority
        />
        <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/50">
          Byound Care
        </p>
        <h1 className="mt-4 text-[clamp(2.4rem,6vw,3.6rem)] font-semibold leading-[0.95] tracking-[-0.04em]">
          Site en maintenance
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/65">
          Nous améliorons Byound Care. Le site public est momentanément indisponible. Merci de
          votre patience — nous revenons très bientôt.
        </p>
        <p className="mt-10 text-sm text-white/40">
          Praticiens : connectez-vous via votre espace habituel.
        </p>
      </div>
    </main>
  );
}
