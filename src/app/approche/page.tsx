import type { Metadata } from "next";
import { BeyondCenterApprochePage } from "@/components/beyond-center/beyond-center-marketing-inner";

export const metadata: Metadata = {
  title: "Approche | Beyond Center",
  description:
    "Vision Beyond Center : comprendre avant de former. Sciences cognitives, psychologie et apprentissage au service de la performance des équipes.",
};

export default function ApprochePage() {
  return <BeyondCenterApprochePage />;
}
