"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronLeft, Minus, Moon, Package, Plus, Sparkles, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RITUEL_SOMMEIL_IMAGES,
  RITUEL_SOMMEIL_PRODUCT,
  type RituelSommeilProductData,
} from "@/lib/jessica-contentin/rituel-sommeil-product";
import { RituelSommeilCommanderButton } from "@/components/jessica-contentin/rituel-sommeil-commander-button";

type Props = {
  product: RituelSommeilProductData;
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
    <div className="border-b border-[#E6D9C6]">
      <button
        type="button"
        className="flex w-full items-center justify-between py-5 text-left text-sm font-medium text-[#2F2A25]"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {title}
        <ChevronDown className={cn("h-5 w-5 text-[#8B6F47] transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div className="pb-5 text-sm leading-relaxed text-[#5C5348]">{children}</div> : null}
    </div>
  );
}

export function CartesRituelSommeilPage({ product }: Props) {
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const displayPrice = product.price.toLocaleString("fr-FR", { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-[#F8F5F0] pb-20 pt-[4.5rem]">
      <div className="border-b border-[#E6D9C6] bg-white px-5 py-2 lg:px-10">
        <div className="mx-auto flex max-w-[1280px] items-center gap-2 text-xs text-[#8B6F47]">
          <Link href="/jessica-contentin/ressources" className="hover:text-[#2F2A25]">
            Outils et ressources
          </Link>
          <span>/</span>
          <span className="text-[#2F2A25]">Rituel du sommeil</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1280px] gap-8 px-5 py-6 lg:grid-cols-[minmax(0,1.15fr)_400px] lg:gap-12 lg:px-10 lg:py-8">
        {/* Galerie */}
        <div>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[#E6D9C6] bg-[#FAF7F2] sm:aspect-[5/6] lg:aspect-[4/5] lg:min-h-[580px]">
            <Image
              src={RITUEL_SOMMEIL_IMAGES[activeImage].url}
              alt={RITUEL_SOMMEIL_IMAGES[activeImage].alt}
              fill
              className="object-contain object-top p-3 sm:p-4 lg:p-5"
              sizes="(max-width:1024px) 100vw, 58vw"
              priority={activeImage === 0}
              unoptimized
            />
          </div>
          <div className="mt-3 flex gap-3">
            {RITUEL_SOMMEIL_IMAGES.map((image, index) => (
              <button
                key={image.url}
                type="button"
                onClick={() => setActiveImage(index)}
                className={cn(
                  "relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition sm:h-24 sm:w-24",
                  activeImage === index ? "border-[#C6A664]" : "border-[#E6D9C6] hover:border-[#C6A664]/50",
                )}
                aria-label={`Voir l'image ${index + 1}`}
                aria-current={activeImage === index}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  className="object-cover object-top p-1"
                  sizes="96px"
                  unoptimized
                />
              </button>
            ))}
          </div>
        </div>

        {/* Fiche produit */}
        <div>
          <Link
            href="/jessica-contentin/ressources"
            className="mb-5 inline-flex items-center gap-1 text-xs text-[#8B6F47] transition hover:text-[#2F2A25]"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour aux outils
          </Link>

          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C6A664]">Jeu de cartes</p>
          <h1
            className="mt-2 text-[clamp(1.75rem,4vw,2.25rem)] font-semibold leading-tight text-[#2F2A25]"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            {RITUEL_SOMMEIL_PRODUCT.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-semibold text-[#2F2A25]">{displayPrice} €</span>
            <span className="text-sm text-[#8B6F47]">TTC</span>
          </div>

          <p className="mt-6 text-[15px] leading-relaxed text-[#5C5348]">
            {RITUEL_SOMMEIL_PRODUCT.shortDescription}
          </p>

          <div className="mt-8 flex flex-wrap gap-4 text-xs text-[#5C5348]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D9C6] bg-white px-3 py-1.5">
              <Moon className="h-3.5 w-3.5 text-[#C6A664]" />
              Rituel du coucher
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D9C6] bg-white px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#C6A664]" />
              {RITUEL_SOMMEIL_PRODUCT.activityCount} activités
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E6D9C6] bg-white px-3 py-1.5">
              <Package className="h-3.5 w-3.5 text-[#C6A664]" />
              3 à 11 ans
            </span>
          </div>

          <div className="mt-8">
            <p className="text-sm font-medium text-[#2F2A25]">Quantité</p>
            <div className="mt-3 flex items-center rounded-xl border border-[#E6D9C6] bg-white">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center text-[#2F2A25] transition hover:bg-[#F8F5F0]"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Diminuer la quantité"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-sm font-medium text-[#2F2A25]">{qty}</span>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center text-[#2F2A25] transition hover:bg-[#F8F5F0]"
                onClick={() => setQty((q) => Math.min(10, q + 1))}
                aria-label="Augmenter la quantité"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[#8B6F47]">
            <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {RITUEL_SOMMEIL_PRODUCT.shipping}
          </p>

          <div className="mt-6">
            <RituelSommeilCommanderButton
              catalogItemId={product.catalogItemId}
              contentId={product.contentId}
              price={product.price}
              quantity={qty}
              stripeCheckoutUrl={product.stripeCheckoutUrl}
            />
          </div>

          <p className="mt-4 text-center text-xs text-[#8B6F47]">
            Paiement sécurisé · Livraison soignée · Cadeau idéal pour les familles
          </p>

          <div className="mt-10">
            <Accordion title="Description" defaultOpen>
              <p>{RITUEL_SOMMEIL_PRODUCT.longDescription}</p>
            </Accordion>
            <Accordion title="Détails du produit">
              <ul className="space-y-2">
                {RITUEL_SOMMEIL_PRODUCT.details.map((detail) => (
                  <li key={detail}>— {detail}</li>
                ))}
              </ul>
            </Accordion>
            <Accordion title="Livraison">
              <p>{RITUEL_SOMMEIL_PRODUCT.shipping}</p>
            </Accordion>
            <Accordion title="Comment jouer">
              <ol className="space-y-3">
                <li>
                  <strong className="text-[#2F2A25]">1. Tirer une carte</strong> — L&apos;enfant pioche au hasard dans
                  le jeu, c&apos;est lui qui lance le rituel.
                </li>
                <li>
                  <strong className="text-[#2F2A25]">2. Lire ensemble</strong> — Parent et enfant découvrent
                  l&apos;activité du soir, sans écran ni pression.
                </li>
                <li>
                  <strong className="text-[#2F2A25]">3. Vivre le moment</strong> — Quelques minutes de complicité avant
                  de dire bonne nuit.
                </li>
              </ol>
            </Accordion>
          </div>
        </div>
      </div>

      <section className="border-t border-[#E6D9C6] bg-white px-5 py-14 lg:px-10">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="text-center text-xl font-semibold text-[#2F2A25]">Pourquoi ce jeu ?</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Un rituel apaisant",
                text: "Transformer le coucher en moment attendu, pas en bataille du soir.",
              },
              {
                title: "Du lien, pas des écrans",
                text: "Des activités concrètes pour un moment privilégié entre parent et enfant.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[#E6D9C6] bg-[#FAF7F2] p-6 text-center"
              >
                <h3 className="font-semibold text-[#2F2A25]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5C5348]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
