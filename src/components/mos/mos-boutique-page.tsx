"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, Heart, Search, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { MosHeader } from "@/components/mos/mos-header";
import { MosFooter } from "@/components/mos/mos-footer";
import {
  BOUTIQUE_CATEGORIES,
  BOUTIQUE_PRODUCTS,
  type BoutiqueProduct,
} from "@/components/mos/mos-boutique-products";

function ProductCard({ product }: { product: BoutiqueProduct }) {
  return (
    <Link href={`/mos/boutique/${product.id}`} className="group block">
      <article>
        <div className="relative aspect-[3/4] overflow-hidden bg-white">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain object-center p-4 transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width:768px) 50vw, 33vw"
            unoptimized
          />
          <span
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
            aria-hidden
          >
            <Heart className="h-4 w-4" />
          </span>
        </div>
        <div className="mt-4">
          {product.badge ? (
            <p className="text-sm font-medium text-[#C8102E]">{product.badge}</p>
          ) : (
            <p className="text-sm text-transparent">.</p>
          )}
          <h3 className="mt-1 text-base font-medium text-[#111111]">{product.name}</h3>
          <p className="mt-1 text-sm text-[#757575]">{product.description}</p>
          <p className="mt-2 text-base font-medium text-[#111111]">
            {product.price.toLocaleString("fr-FR")} €
          </p>
        </div>
      </article>
    </Link>
  );
}

export function MosBoutiquePage() {
  const [category, setCategory] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const filtered = useMemo(() => {
    let list = [...BOUTIQUE_PRODUCTS];
    if (category) list = list.filter((p) => p.category === category);
    if (gender) list = list.filter((p) => p.gender === gender || p.gender === "Unisex");
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [category, gender, sort]);

  return (
    <>
      <MosHeader />

      {/* Promo bar */}
      <div className="mt-24 bg-[#F5F5F5] py-2.5 text-center text-xs text-[#111111]">
        Livraison offerte dès 80€ · Retrait au club sous 48h
      </div>

      {/* Shop sub-header */}
      <div className="border-b border-[#E5E5E5] bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3 lg:px-10">
          <Link href="/mos" className="text-xs text-[#757575] hover:text-[#111111]">
            ← Accueil MOS
          </Link>
          <div className="hidden items-center gap-4 sm:flex">
            <div className="flex items-center gap-2 rounded-full bg-[#F5F5F5] px-4 py-2">
              <Search className="h-4 w-4 text-[#757575]" />
              <span className="text-sm text-[#757575]">Rechercher</span>
            </div>
            <button type="button" className="p-2" aria-label="Favoris">
              <Heart className="h-5 w-5" />
            </button>
            <button type="button" className="p-2" aria-label="Panier">
              <ShoppingBag className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Hero banner — Nike style */}
      <section className="relative overflow-hidden bg-[#C8102E]">
        <div className="mx-auto grid max-w-[1400px] lg:grid-cols-2">
          <div className="flex flex-col justify-center px-5 py-16 lg:px-10 lg:py-24">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Saison 2025/2026</p>
            <h1 className="mt-4 text-[clamp(2.5rem,6vw,4rem)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-white">
              Porter
              <br />
              la MOS
            </h1>
            <p className="mt-6 max-w-md text-base text-white/75">
              Maillots officiels, training et lifestyle. L&apos;identité de la Maladrerie, sur le terrain et dans les
              rues de Caen.
            </p>
            <Link
              href="#produits"
              className="mt-8 inline-flex w-fit items-center text-sm font-semibold text-white underline underline-offset-4 hover:opacity-80"
            >
              Découvrir la collection
            </Link>
          </div>
          <div className="relative min-h-[320px] lg:min-h-[480px]">
            <Image
              src="/mos/boutique-maillot-2026.png"
              alt="Maillot MOS 2026"
              fill
              className="object-cover object-top"
              sizes="50vw"
              priority
              unoptimized
            />
          </div>
        </div>
      </section>

      {/* Featured wide card */}
      <section className="border-b border-[#E5E5E5] bg-white px-5 py-6 lg:px-10">
        <div className="mx-auto grid max-w-[1400px] overflow-hidden rounded-2xl bg-[#111111] lg:grid-cols-2">
          <div className="relative min-h-[280px]">
            <Image
              src="/mos/boutique-maillot-2026.png"
              alt=""
              fill
              className="object-cover object-top opacity-95"
              sizes="50vw"
              unoptimized
            />
          </div>
          <div className="flex flex-col justify-center p-10 lg:p-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Le match continue</p>
            <h2 className="mt-4 text-3xl font-black uppercase tracking-tight text-white lg:text-4xl">
              Maillot domicile 2026
            </h2>
            <p className="mt-4 text-sm text-white/60">Rouge MOS · Macron · Flocage personnalisable</p>
            <Link
              href="/mos/boutique/maillot-domicile-2026"
              className="mt-8 inline-flex w-fit rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#111111] hover:bg-[#F5F5F5]"
            >
              Acheter — 79 €
            </Link>
          </div>
        </div>
      </section>

      {/* Product listing */}
      <section id="produits" className="bg-white px-5 py-10 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E5E5E5] pb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#111111]">
                Collection MOS ({filtered.length})
              </h2>
              <p className="mt-1 text-sm text-[#757575]">Maillots, training et accessoires officiels</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-[#E5E5E5] px-4 py-2 text-sm hover:border-[#111111]"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {filtersOpen ? "Masquer les filtres" : "Afficher les filtres"}
              </button>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none rounded-full border border-[#E5E5E5] bg-white py-2 pl-4 pr-10 text-sm hover:border-[#111111]"
                >
                  <option value="featured">Trier par : En vedette</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-10">
            {filtersOpen ? (
              <aside className="hidden w-52 shrink-0 lg:block">
                <div className="space-y-8">
                  <div>
                    <p className="text-sm font-medium text-[#111111]">Catégorie</p>
                    <ul className="mt-3 space-y-2 text-sm text-[#757575]">
                      <li>
                        <button
                          type="button"
                          className={cn("hover:text-[#111111]", !category && "font-medium text-[#111111]")}
                          onClick={() => setCategory("")}
                        >
                          Tout
                        </button>
                      </li>
                      {BOUTIQUE_CATEGORIES.map((c) => (
                        <li key={c}>
                          <button
                            type="button"
                            className={cn("hover:text-[#111111]", category === c && "font-medium text-[#111111]")}
                            onClick={() => setCategory(c)}
                          >
                            {c}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#111111]">Sexe</p>
                    <ul className="mt-3 space-y-2 text-sm text-[#757575]">
                      {["", "Homme", "Femme", "Unisex"].map((g) => (
                        <li key={g || "all"}>
                          <button
                            type="button"
                            className={cn("hover:text-[#111111]", gender === g && "font-medium text-[#111111]")}
                            onClick={() => setGender(g)}
                          >
                            {g || "Tout"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </aside>
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEO block — Nike style footer text */}
      <section className="border-t border-[#E5E5E5] bg-[#F5F5F5] px-5 py-12 lg:px-10">
        <div className="mx-auto max-w-[900px] text-center text-sm leading-relaxed text-[#757575]">
          <p>
            Découvrez la boutique officielle MOS Caen. Maillots domicile, training et accessoires aux couleurs de la
            Maladrerie OmniSports. Retrait au club ou livraison à domicile. Flocage nom et numéro disponible sur
            demande.
          </p>
        </div>
      </section>

      <MosFooter />
    </>
  );
}
