import Link from "next/link";
import type { Metadata } from "next";
import { EDGE_HREFS } from "@/lib/edge-site/constants";

export const metadata: Metadata = {
  title: "Test d'orientation — EDGE",
  description: "Trouve le parcours ou le format EDGE adapté à ton profil en 2 minutes.",
};

export default function EdgeOrientationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-white font-sans text-edge-black antialiased">
      <header className="relative flex h-14 shrink-0 items-center justify-center border-b border-black/[0.08] px-5 sm:px-10">
        <Link href={EDGE_HREFS.home} className="text-sm font-medium tracking-[0.12em] text-edge-black">
          EDGE
        </Link>
        <Link
          href={EDGE_HREFS.home}
          className="absolute right-5 text-[13px] text-black/40 transition-colors hover:text-edge-black sm:right-10"
        >
          Retour au site
        </Link>
      </header>
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
