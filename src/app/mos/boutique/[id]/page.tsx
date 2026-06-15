import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MosBoutiqueProductPage } from "@/components/mos/mos-boutique-product-page";
import { getBoutiqueProduct, getBoutiqueProductIds } from "@/components/mos/mos-boutique-products";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamicParams = true;

export function generateStaticParams() {
  return getBoutiqueProductIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = getBoutiqueProduct(id);
  if (!product) return { title: "Produit — MOS Caen" };
  return {
    title: `${product.name} — Boutique MOS Caen`,
    description: product.description,
  };
}

export default async function MosBoutiqueProductRoute({ params }: Props) {
  const { id } = await params;
  const product = getBoutiqueProduct(id);
  if (!product) notFound();
  return <MosBoutiqueProductPage product={product} />;
}
