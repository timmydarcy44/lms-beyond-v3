import { Manrope } from "next/font/google";
import { AccountManagersCockpit } from "@/components/control/account-managers-cockpit";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

export const dynamic = "force-dynamic";

export default function GestionnairesPage() {
  return (
    <div className={manrope.className} style={{ background: "#0A0F1E", color: "#F4F7FF", minHeight: "100%" }}>
      <AccountManagersCockpit />
    </div>
  );
}
