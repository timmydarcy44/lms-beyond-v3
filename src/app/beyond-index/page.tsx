import type { Metadata } from "next";
import { BeyondIndexApp } from "@/components/beyond-index/beyond-index-app";

export const metadata: Metadata = {
  title: "Beyond Index | Index de Maturité Compétences",
  description:
    "Évaluez en quelques minutes la capacité de votre organisation à identifier, développer et reconnaître les compétences.",
};

export default function BeyondIndexPage() {
  return <BeyondIndexApp />;
}
