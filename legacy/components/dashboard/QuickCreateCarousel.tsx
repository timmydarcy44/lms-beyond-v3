"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useMemo } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export type QuickItem = {
  key: "program" | "resource" | "test" | "learner" | "group" | string;
  kicker?: string;
  title: string;
  subtitle?: string;
  href: string;
  imageSrc?: string;
};

type QuickCreateCarouselProps = {
  items: QuickItem[];
};

export default function QuickCreateCarousel({ items }: QuickCreateCarouselProps) {
  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 mt-6">
      <div
        className="flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory snap-start [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        aria-label="Actions de création rapide"
      >
        {items.map((item) => (
          <QuickCard key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
}

function QuickCard({ item }: { item: QuickItem }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Génère l'URL publique attendue pour ce key (predictable path)
  const publicUrl = useMemo(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
    const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cards/${item.key}.png`;
    return imgUrl ? imgUrl : `${base}?v=${Date.now()}`; // cache-busting basique
  }, [item.key, imgUrl]);

  async function handleUpload(file: File) {
    try {
      const sb = createClientComponentClient();
      // Upload en overwrite (upsert=True)
      const { error: upErr } = await sb.storage
        .from("cards")
        .upload(`${item.key}.png`, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;

      // Récupère l'URL publique officielle depuis Supabase
      const { data } = sb.storage.from("cards").getPublicUrl(`${item.key}.png`);
      if (data?.publicUrl) {
        // Ajoute un cache-busting pour forcer le refresh visuel
        setImgUrl(`${data.publicUrl}?v=${Date.now()}`);
      }
    } catch (e: any) {
      console.error("Upload image card error:", e?.message || e);
      alert("Échec de l'upload de l'image.");
    }
  }

  function onPickFile() {
    fileInputRef.current?.click();
  }

  return (
    <div className="snap-start relative h-[340px] w-[580px] sm:w-[640px] rounded-3xl overflow-hidden shadow-xl ring-1 ring-white/10 bg-zinc-900/70 hover:bg-zinc-900/80 transition-all hover:scale-[1.01] hover:ring-white/20 group">
      <Link
        href={item.href}
        className="absolute inset-0 focus:outline-none focus:ring-2 focus:ring-white/70"
        aria-label={`${item.kicker} ${item.title} - ${item.subtitle}`}
      >
        {/* Image de fond (Supabase Storage) si dispo, sinon ça affichera le fond dégradé existant */}
        {publicUrl && (
          <Image
            src={publicUrl}
            alt={item.title}
            fill
            className="object-cover opacity-70"
            priority={false}
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        )}

        {/* Overlay premium */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent" />

        {/* Bouton Uploader — discret, visible au hover (en haut à droite) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onPickFile();
          }}
          className="absolute right-3 top-3 hidden group-hover:inline-flex items-center gap-2 rounded-lg bg-black/50 px-3 py-1.5 text-xs text-white ring-1 ring-white/20 hover:ring-white/40 backdrop-blur-md transition-colors"
          aria-label={`Uploader une image pour ${item.title}`}
        >
          {/* Icône minimaliste */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Uploader
        </button>

        <input
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.currentTarget.value = ""; // reset
          }}
        />

        {/* Contenu existant — NE PAS MODIFIER */}
        <div className="relative p-5">
          <div className="text-[11px] tracking-[0.18em] text-white/70">{item.kicker}</div>
          <h3 className="mt-1 text-2xl font-semibold text-white">{item.title}</h3>
          <p className="mt-1 text-sm text-white/70">{item.subtitle}</p>

          <a
            href={item.href}
            onClick={(e) => e.stopPropagation()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-300 text-black px-4 py-2 font-medium shadow-sm ring-1 ring-white/15 hover:ring-white/35 transition-all max-w-fit"
          >
            Commencer <span>→</span>
          </a>
        </div>
      </Link>
    </div>
  );
}
