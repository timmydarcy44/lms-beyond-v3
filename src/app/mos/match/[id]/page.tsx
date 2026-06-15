import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MosMatchPage } from "@/components/mos/mos-match-page";
import { getCalendarMatch, getCalendarMatchIds } from "@/components/mos/constants";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamicParams = true;

export function generateStaticParams() {
  return getCalendarMatchIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const match = getCalendarMatch(id);
  if (!match) return { title: "Match center — MOS Caen" };
  return {
    title: `${match.home.name} vs ${match.away.name} — Match center MOS`,
    description: match.presentation,
  };
}

export default async function MosMatchRoute({ params }: Props) {
  const { id } = await params;
  const match = getCalendarMatch(id);
  if (!match) notFound();
  return <MosMatchPage match={match} />;
}
