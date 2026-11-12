import { Manrope } from "next/font/google";
import { CfaDemandesInbox } from "@/components/control/cfa-demandes-inbox";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

export const dynamic = "force-dynamic";

export default function CfaDemandesEntrantesPage() {
  return (
    <div className={manrope.className} style={{ background: "#0A0F1E", color: "#F4F7FF", minHeight: "100%" }}>
      <CfaDemandesInbox />
    </div>
  );
}
