import type { Metadata } from "next";
import { MosBoutiquePage } from "@/components/mos/mos-boutique-page";

export const metadata: Metadata = {
  title: "Boutique officielle — MOS Caen",
  description: "Maillots, training et accessoires officiels MOS Caen. Collection 2025/2026.",
};

export default function MosBoutiqueRoute() {
  return <MosBoutiquePage />;
}
