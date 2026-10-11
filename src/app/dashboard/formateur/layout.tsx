import { Manrope } from "next/font/google";

import "@/styles/edge-connect.css";
import "@/styles/expert-revolut.css";

import { FormateurConnectShell } from "@/components/formateur/formateur-connect-shell";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-expert",
});

export default function FormateurDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={manrope.variable}>
      <FormateurConnectShell>{children}</FormateurConnectShell>
    </div>
  );
}
