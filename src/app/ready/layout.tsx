import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-ready",
});

export const metadata: Metadata = {
  title: "Byound Ready",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function ReadyLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${inter.variable} ${inter.className}`}
      style={{
        minHeight: "100vh",
        background: "#000",
        color: "#fff",
        ["--ready-card" as string]: "#121217",
        ["--ready-tile" as string]: "#1C1C23",
        ["--ready-muted" as string]: "rgba(255,255,255,.62)",
        ["--ready-gradient" as string]:
          "linear-gradient(120deg, #FF5A00, #FF0A30 55%, #FF007D)",
      }}
    >
      {children}
    </div>
  );
}
