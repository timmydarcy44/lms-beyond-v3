import type { Metadata } from "next";
import { BesoinValiderClient } from "./besoin-valider-client";

export const metadata: Metadata = {
  title: "Validation de l’analyse du besoin | Byound",
  robots: { index: false, follow: false },
};

export default async function BesoinValiderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <BesoinValiderClient token={token} />;
}
