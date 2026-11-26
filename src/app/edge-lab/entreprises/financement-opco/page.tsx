import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";

/** Page OPCO retirée du front public (audit Qualiopi) — financement entreprise uniquement. */
export const metadata: Metadata = {
  title: "Financement — Byound Business",
  description: "Financement par l'entreprise cliente. Contactez Byound pour un devis.",
  alternates: { canonical: `${BYOUND_PUBLIC_ORIGIN}/entreprises` },
  robots: { index: false, follow: false },
};

export default function Page() {
  redirect("/entreprises");
}
