import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Manrope } from "next/font/google";
import { PostulerOffer } from "@/components/offres/postuler-offer";
import { getPublicOffer } from "@/lib/offres/public-offers";
import { getServiceRoleClient } from "@/lib/supabase/server";

const manrope = Manrope({ subsets: ["latin"] });

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<{ compte?: string }> };

export const metadata: Metadata = {
  title: "Postuler — Byound",
  robots: { index: false, follow: false },
};

export default async function PostulerPage({ params, searchParams }: Params) {
  const { slug } = await params;
  const query = await searchParams;
  const db = getServiceRoleClient();
  const offer = db ? await getPublicOffer(db, slug) : null;
  if (!offer || !db) notFound();
  return (
    <div className={`${manrope.className} min-h-screen bg-[#070C1C] text-white`}>
      <PostulerOffer offer={offer} login={query.compte === "login"} />
    </div>
  );
}
