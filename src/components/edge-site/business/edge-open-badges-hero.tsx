"use client";

import { useRef } from "react";
import { motion } from "framer-motion";

import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";

const OPEN_BADGES_VIDEO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/presentation%20OB.mp4";

type Props = {
  signupHref?: string;
};

export function EdgeOpenBadgesHero({ signupHref = "/entreprises/connexion" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <section className="relative min-h-[min(92svh,880px)] overflow-hidden bg-edge-black-deep">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <video
          ref={videoRef}
          src={OPEN_BADGES_VIDEO_URL}
          className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-center"
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={(e) => {
            const video = e.currentTarget;
            video.pause();
            if (video.duration && Number.isFinite(video.duration)) {
              video.currentTime = Math.max(0, video.duration - 0.05);
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-edge-black-deep/80 via-edge-black-deep/45 to-edge-black-deep/70" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[min(92svh,880px)] max-w-4xl flex-col items-center px-5 pb-20 pt-28 text-center sm:px-8 lg:px-10 lg:pt-36">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full"
        >
          <p className="text-sm font-medium tracking-wide text-white/70 sm:text-base">Open badge</p>
          <h1 className="mt-5 text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
            Rendez visible l&apos;invisible
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
            Certifiez les compétences acquises en formation ou sur le terrain. Des badges vérifiables,
            partageables et reconnus — pour valoriser chaque parcours et renforcer votre marque employeur.
          </p>
          <div className="mt-10 flex justify-center">
            <EdgePremiumButton href={signupHref} variant="white" shape="revolut" className="min-w-[200px]">
              Ouvrir un compte
            </EdgePremiumButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
