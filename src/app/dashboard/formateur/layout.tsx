import { Manrope } from "next/font/google";

import "@/styles/edge-connect.css";
import "@/styles/expert-revolut.css";

import { redirect } from "next/navigation";

import { JadeInternalFill } from "@/components/demo/jade-internal-fill";
import { FormateurConnectShell } from "@/components/formateur/formateur-connect-shell";
import { expertMustLeaveFormateur } from "@/lib/expert/poles";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-expert",
});

export default async function FormateurDashboardLayout({ children }: { children: React.ReactNode }) {
  if (await expertMustLeaveFormateur()) {
    redirect("/dashboard/expert");
  }
  return (
    <div className={manrope.variable}>
      <FormateurConnectShell>
        <JadeInternalFill>{children}</JadeInternalFill>
      </FormateurConnectShell>
    </div>
  );
}
