"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const HeroPhoneScene = dynamic(
  () => import("./hero-phone-scene").then((m) => m.HeroPhoneScene),
  {
    ssr: false,
    loading: () => <HeroPhoneFallback />,
  },
);

function HeroPhoneFallback() {
  return (
    <div className="relative flex h-full min-h-[600px] w-full items-center justify-center">
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.95, 1, 0.95] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="h-[min(520px,70vh)] w-[min(280px,55vw)] rounded-[3rem] bg-gradient-to-b from-zinc-800/40 to-zinc-950/60 blur-sm"
      />
      <p className="absolute bottom-[20%] text-[11px] uppercase tracking-[0.3em] text-zinc-600">
        Chargement…
      </p>
    </div>
  );
}

export function HeroPhone3D({ className }: { className?: string }) {
  return <HeroPhoneScene className={className} />;
}
