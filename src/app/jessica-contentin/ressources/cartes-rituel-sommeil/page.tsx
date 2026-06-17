import type { Metadata } from "next";
import { CartesRituelSommeilPage } from "@/components/jessica-contentin/cartes-rituel-sommeil-page";
import { loadRituelSommeilProduct } from "@/lib/jessica-contentin/load-rituel-sommeil-product";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rituel du sommeil : Jeu de cartes & Neuroéducation pour enfants",
  description:
    "Commandez le jeu de cartes Rituel du sommeil : un rituel du coucher apaisant pour créer un moment privilégié entre parent et enfant.",
};

export default async function CartesRituelSommeilRoutePage() {
  const product = await loadRituelSommeilProduct();
  return <CartesRituelSommeilPage product={product} />;
}
