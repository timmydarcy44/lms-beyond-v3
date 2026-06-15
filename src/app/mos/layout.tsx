import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-mos-display",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-mos-body",
});

export const metadata: Metadata = {
  title: "MOS Caen — Maladrerie OmniSports",
  description:
    "Club de football de Caen depuis 1965. Formation, passion et engagement au cœur de la Maladrerie.",
};

export default function MosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        oswald.variable,
        inter.variable,
        "min-h-screen bg-white font-[family-name:var(--font-mos-body)] text-[#111111] antialiased",
        "[&_h1]:font-[family-name:var(--font-mos-display)] [&_h2]:font-[family-name:var(--font-mos-display)] [&_h3]:font-[family-name:var(--font-mos-display)]",
      )}
    >
      {children}
    </div>
  );
}
