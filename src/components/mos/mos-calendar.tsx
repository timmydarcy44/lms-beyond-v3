"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { CALENDAR_MATCHES, type CalendarMatch } from "@/components/mos/constants";
import { MosLogo } from "@/components/mos/mos-logo";
import { Reveal } from "@/components/mos/motion";

function TeamRow({
  name,
  score,
  isMos,
}: {
  name: string;
  score?: number;
  isMos?: boolean;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {isMos ? (
          <div className="relative h-8 w-7 shrink-0 overflow-hidden">
            <MosLogo size="sm" />
          </div>
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-[10px] font-bold text-[#111111]">
            {initials}
          </div>
        )}
        <span className="truncate text-sm font-bold uppercase tracking-wide text-[#111111]">{name}</span>
      </div>
      {score != null ? (
        <span className="text-2xl font-black italic tabular-nums text-[#004170]">{score}</span>
      ) : (
        <span className="text-xs font-semibold uppercase tracking-wider text-[#111111]/30">—</span>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: CalendarMatch }) {
  return (
    <article
      className="relative min-w-[280px] max-w-[280px] shrink-0 snap-start bg-white p-5 sm:min-w-[300px] sm:max-w-[300px]"
      style={{
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle at 80% 20%, #C8102E 0%, transparent 55%)",
        }}
        aria-hidden
      />

      <div className="relative flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#111111]/45">
        <span className="rounded bg-[#F5F5F5] px-2 py-0.5 text-[#111111]">
          {match.category} · {match.categoryLabel}
        </span>
        <span>{match.status}</span>
        <span className="ml-auto text-[#111111]/30">{match.date}</span>
      </div>

      <div className="relative mt-5 space-y-4">
        <TeamRow name={match.home.name} score={match.home.score} isMos={match.home.name.includes("MOS")} />
        <TeamRow name={match.away.name} score={match.away.score} isMos={match.away.name.includes("MOS")} />
      </div>

      <div className="relative mt-5 border-t border-[#111111]/8 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#111111]/35">{match.competition}</p>
        <Link
          href={`/mos/match/${match.id}`}
          className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.12em] text-[#004170] transition-opacity hover:opacity-70"
        >
          Match center
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

export function MosCalendar() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const scroll = (direction: "left" | "right") => {
    trackRef.current?.scrollBy({ left: direction === "left" ? -320 : 320, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setScrollProgress(max > 0 ? el.scrollLeft / max : 0);
  };

  return (
    <section id="calendrier" className="scroll-mt-24 bg-[#0d1520] px-5 py-14 sm:px-10 sm:py-16">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-black uppercase tracking-[-0.02em] text-white">
              Calendrier
            </h2>
            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => scroll("left")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:bg-white/10"
                aria-label="Matchs précédents"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:bg-white/10"
                aria-label="Matchs suivants"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </Reveal>

        <div className="relative mt-8">
          <div
            ref={trackRef}
            onScroll={onScroll}
            className="flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
          >
            {CALENDAR_MATCHES.map((match, i) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
              >
                <MatchCard match={match} />
              </motion.div>
            ))}
          </div>

          <div className="mx-auto mt-6 h-[2px] w-48 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${Math.max(20, scrollProgress * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
