import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beyond Studio — Systèmes pensés pour les humains",
  description:
    "Applications, workflows, expériences digitales et systèmes IA. Studio produit premium.",
  openGraph: {
    title: "Beyond Studio",
    description: "Nous construisons des systèmes pensés pour les humains.",
  },
};

export default function BeyondStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="beyond-studio-root min-h-screen scroll-smooth antialiased selection:bg-sky-500/20">
      {children}
    </div>
  );
}
