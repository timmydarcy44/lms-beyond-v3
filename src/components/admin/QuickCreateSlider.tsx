"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

// Quick actions displayed on the dashboard (admin/formateur)
// When an item contains an `href`, we render a Next.js Link so navigation works in server components too.

type QuickItem = {
  key: string;
  title: string;
  subtitle: string;
  cta?: string;
  image?: string;
  href?: string;
  onClick?: () => void;
};

type QuickCreateSliderProps = {
  items: QuickItem[];
};

export const QuickCreateSlider = ({ items }: QuickCreateSliderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (offset: number) => {
    containerRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section className="relative">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Actions rapides</h2>
          <p className="text-sm text-white/60">
            Accédez en un clic aux outils qui accélèrent vos lancements.
          </p>
        </div>
        <div className="hidden gap-2 lg:flex">
          <button
            type="button"
            onClick={() => scroll(-320)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Défiler vers la gauche"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll(320)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Défiler vers la droite"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6 pr-4 scrollbar-none"
      >
        {items.map((item) => (
          <QuickActionCard key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
};

const QuickActionCard = ({ item }: { item: QuickItem }) => {
  const content = (
    <>
      {item.image ? (
        <div className="relative h-40 w-full overflow-hidden">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-110 group-hover:saturate-125"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        </div>
      ) : null}
      <div className="relative space-y-4 px-6 py-7 text-white">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.32),_transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div>
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/75">
            {item.key.startsWith("create") ? "Créer" : "Accélérer"}
          </span>
          <h3 className="mt-3 text-lg font-semibold leading-tight">{item.title}</h3>
          <p className="mt-2 text-sm text-white/70">{item.subtitle}</p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-white/85">
          {item.cta ?? "Commencer"}
          <ChevronRight className="h-4 w-4" />
        </span>
      </div>
      <span className="pointer-events-none absolute -right-8 top-8 h-32 w-32 rounded-full bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.35),_transparent_70%)] blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        className="group relative flex min-w-[260px] snap-start flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101828d9] via-[#1f2937d9] to-[#07091ad9] text-left shadow-[0_30px_80px_-40px_rgba(56,189,248,0.55)] transition duration-300 hover:scale-[1.03] hover:border-white/25"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={item.onClick}
      className="group relative flex min-w-[260px] snap-start flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#101828d9] via-[#1f2937d9] to-[#07091ad9] text-left shadow-[0_30px_80px_-40px_rgba(56,189,248,0.55)] transition duration-300 hover:scale-[1.03] hover:border-white/25"
    >
      {content}
    </button>
  );
};


