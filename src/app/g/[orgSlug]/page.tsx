import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GalaxyIndexPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  redirect(`/g/${encodeURIComponent(String(orgSlug ?? "").trim())}/dashboard/student/learning/formations`);
}

