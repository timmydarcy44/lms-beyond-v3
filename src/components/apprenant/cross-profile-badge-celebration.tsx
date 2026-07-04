"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Award, Check } from "lucide-react";

export function CrossProfileBadgeCelebration({
  badgeName,
  badgeImageUrl,
  walletHref,
  onDismiss,
}: {
  badgeName: string;
  badgeImageUrl: string | null;
  walletHref: string;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
      <motion.div
        className="w-full max-w-md rounded-3xl bg-[#0a0a0a] p-8 text-center text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="mx-auto mb-6 flex h-32 w-32 items-center justify-center"
          initial={{ rotateY: 0, scale: 0.85, opacity: 0 }}
          animate={{ rotateY: 360, scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ perspective: 800 }}
        >
          {badgeImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={badgeImageUrl}
              alt=""
              className="h-28 w-28 rounded-2xl object-cover ring-2 ring-white/15"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white/10 ring-2 ring-white/15">
              <Award className="h-14 w-14 text-[#FF3B30]" strokeWidth={1.75} />
            </div>
          )}
        </motion.div>

        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#FF3B30]/20">
          <Check className="h-6 w-6 text-[#FF3B30]" strokeWidth={2.5} />
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-white/45">EDGE</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight">Félicitations</h2>
        <p className="mt-4 text-base leading-relaxed text-white/85">
          Vous obtenez votre badge{" "}
          <span className="font-semibold text-white">{badgeName}</span>. Consultez votre Profil comportemental EDGE
          et vos priorités de progression.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={walletHref}
            onClick={onDismiss}
            className="inline-flex items-center justify-center rounded-full bg-[#FF3B30] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white"
          >
            Voir mon Profil EDGE
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="text-sm text-white/55 underline-offset-2 hover:text-white/80 hover:underline"
          >
            Continuer
          </button>
        </div>
      </motion.div>
    </div>
  );
}
