"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { TEAMS_MEGA_MENU } from "@/components/mos/constants";

type Props = {
  onNavigate?: () => void;
};

export function MosTeamsMegaMenu({ onNavigate }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="absolute left-0 right-0 top-full z-50 border-t-4 border-[#C8102E] bg-[#F5F5F5] shadow-[0_24px_60px_rgba(0,0,0,0.12)]"
    >
      <div className="mx-auto grid max-w-[1400px] gap-10 px-8 py-10 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {TEAMS_MEGA_MENU.columns.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#111111]">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.teams.map((team) => (
                  <li key={team.label}>
                    <Link
                      href={team.href}
                      className="text-sm text-[#111111]/70 transition hover:text-[#C8102E]"
                      onClick={onNavigate}
                    >
                      {team.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-l border-[#E0E0E0] pl-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#111111]">Actualités des équipes</p>
          <div className="mt-5 space-y-5">
            {TEAMS_MEGA_MENU.news.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group flex gap-4"
                onClick={onNavigate}
              >
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded bg-white">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="112px"
                    unoptimized={item.image.endsWith(".jpg")}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#757575]">
                    {item.category} — {item.date}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm leading-snug text-[#111111] group-hover:text-[#C8102E]">
                    {item.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
