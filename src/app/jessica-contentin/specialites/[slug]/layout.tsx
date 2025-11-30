import { Metadata } from "next";
import { generateSpecialityMetadata } from "./metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return generateSpecialityMetadata(slug);
}

export default function SpecialityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

