"use client";
import { useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

type Slide = {
  title: string;
  subtitle?: string;
  href: string;
  image: string;
};

export default function HeroSlider({
  userName,
  slides,
}: {
  userName: string;
  slides: Slide[];
}) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-6 pt-8">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
          {userName} <span className="inline-block animate-pulse">👋</span>
        </h1>
      </div>

      <div className="mt-6">
        <div
          ref={ref}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="snap-start relative shrink-0 w-[88vw] sm:w-[680px] md:w-[820px] h-[320px] md:h-[420px] rounded-3xl overflow-hidden border border-white/10"
            >
              <img
                src={s.image}
                alt={s.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-black/30 to-transparent" />
              <div className="absolute left-6 bottom-6">
                <div className="text-white/80 text-sm mb-1">Créer</div>
                <h2 className="text-3xl md:text-4xl font-semibold text-white drop-shadow">
                  {s.title}
                </h2>
                {s.subtitle && (
                  <p className="text-white/80 mt-1">{s.subtitle}</p>
                )}
                <Link
                  href={s.href}
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/90 text-black px-5 py-2.5 text-sm font-medium hover:bg-white transition"
                >
                  Commencer
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}



