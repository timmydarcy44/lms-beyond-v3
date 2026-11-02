import { Manrope } from "next/font/google";
import { AccountsCockpit } from "@/components/control/accounts-cockpit";
import { loadControlCockpit } from "@/lib/control/load";

const manrope = Manrope({ subsets: ["latin"] });

export const dynamic = "force-dynamic";

export default async function ComptesClientsPage() {
  const data = await loadControlCockpit();
  return (
    <div className={manrope.className} style={{ background: "#0A0F1E", color: "#F4F7FF" }}>
      <AccountsCockpit data={data} />
    </div>
  );
}
