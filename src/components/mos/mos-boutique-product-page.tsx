"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Heart, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MosHeader } from "@/components/mos/mos-header";
import { MosFooter } from "@/components/mos/mos-footer";
import type { BoutiqueProduct } from "@/components/mos/mos-boutique-products";

type Props = {
  product: BoutiqueProduct;
};

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[#E5E5E5]">
      <button
        type="button"
        className="flex w-full items-center justify-between py-5 text-left text-sm font-medium text-[#111111]"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {title}
        <ChevronDown className={cn("h-5 w-5 transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="pb-5 text-sm leading-relaxed text-[#757575]">{children}</div> : null}
    </div>
  );
}

export function MosBoutiqueProductPage({ product }: Props) {
  const images = product.images ?? [product.image];
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const displayPrice = product.price.toLocaleString("fr-FR", { minimumFractionDigits: 2 });
  const originalPrice = product.originalPrice?.toLocaleString("fr-FR", { minimumFractionDigits: 2 });

  return (
    <>
      <MosHeader />

      <div className="mt-24 bg-white">
        <div className="border-b border-[#E5E5E5] px-5 py-3 lg:px-10">
          <div className="mx-auto flex max-w-[1400px] items-center gap-2 text-xs text-[#757575]">
            <Link href="/mos" className="hover:text-[#111111]">
              MOS Caen
            </Link>
            <span>/</span>
            <Link href="/mos/boutique" className="hover:text-[#111111]">
              Boutique
            </Link>
            <span>/</span>
            <span className="text-[#111111]">{product.name}</span>
          </div>
        </div>

        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-10 lg:grid-cols-[1fr_420px] lg:gap-16 lg:px-10 lg:py-14">
          {/* Gallery */}
          <div className="flex gap-4">
            <div className="hidden shrink-0 flex-col gap-3 sm:flex">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "relative h-16 w-16 overflow-hidden border bg-white transition",
                    activeImage === i ? "border-[#111111]" : "border-[#E5E5E5] hover:border-[#111111]/40",
                  )}
                >
                  <Image src={src} alt="" fill className="object-contain p-1" sizes="64px" unoptimized />
                </button>
              ))}
            </div>

            <div className="relative min-h-[420px] flex-1 bg-[#F5F5F5] lg:min-h-[560px]">
              <Image
                src={images[activeImage] ?? product.image}
                alt={product.name}
                fill
                className="object-contain p-6 lg:p-10"
                sizes="(max-width:1024px) 100vw, 60vw"
                priority
                unoptimized
              />
              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md"
                    onClick={() => setActiveImage((i) => (i === 0 ? images.length - 1 : i - 1))}
                    aria-label="Image précédente"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md"
                    onClick={() => setActiveImage((i) => (i === images.length - 1 ? 0 : i + 1))}
                    aria-label="Image suivante"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* Product info */}
          <div className="lg:pt-4">
            <Link
              href="/mos/boutique"
              className="mb-6 inline-flex items-center gap-1 text-xs text-[#757575] hover:text-[#111111]"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour à la boutique
            </Link>

            <h1 className="text-2xl font-medium leading-snug text-[#111111] lg:text-[1.75rem]">{product.name}</h1>

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <span className="text-xl font-medium text-[#C8102E]">{displayPrice} €</span>
              {originalPrice ? (
                <span className="text-base text-[#757575] line-through">{originalPrice} €</span>
              ) : null}
            </div>
            {product.badge ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#C8102E]">{product.badge}</p>
            ) : null}

            <p className="mt-6 text-sm text-[#757575]">{product.description}</p>

            <div className="mt-8">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#111111]">Taille</p>
                <button type="button" className="text-xs text-[#757575] underline underline-offset-2">
                  Tableau des tailles
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "min-w-[3rem] rounded border px-4 py-2.5 text-sm transition",
                      selectedSize === size
                        ? "border-[#111111] bg-[#111111] text-white"
                        : "border-[#E5E5E5] text-[#111111] hover:border-[#111111]",
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <p className="text-sm font-medium text-[#111111]">Quantité</p>
              <div className="flex items-center rounded border border-[#E5E5E5]">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center hover:bg-[#F5F5F5]"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Diminuer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm">{qty}</span>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center hover:bg-[#F5F5F5]"
                  onClick={() => setQty((q) => q + 1)}
                  aria-label="Augmenter"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[#757575]">
              {selectedSize
                ? product.shipping
                : "Sélectionnez une taille pour afficher les informations de livraison."}
            </p>

            <button
              type="button"
              disabled={!selectedSize}
              className={cn(
                "mt-6 flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-semibold transition",
                selectedSize
                  ? "bg-[#111111] text-white hover:bg-[#333333]"
                  : "cursor-not-allowed bg-[#E5E5E5] text-[#757575]",
              )}
            >
              Ajouter au panier
            </button>

            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#E5E5E5] py-4 text-sm font-medium text-[#111111] hover:border-[#111111]"
            >
              <Heart className="h-4 w-4" />
              Ajouter aux favoris
            </button>

            <div className="mt-10">
              <Accordion title="Description" defaultOpen>
                <p>{product.longDescription}</p>
              </Accordion>
              <Accordion title="Détails">
                <ul className="space-y-2">
                  {product.details.map((d) => (
                    <li key={d}>— {d}</li>
                  ))}
                </ul>
              </Accordion>
              <Accordion title="Expédition">
                <p>{product.shipping}</p>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      <MosFooter />
    </>
  );
}
