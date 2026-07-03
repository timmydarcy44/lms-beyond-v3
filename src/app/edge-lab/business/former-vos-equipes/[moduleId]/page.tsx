import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EdgeTrainingDetailPage } from "@/components/edge-site/business/edge-training-detail-page";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { getModuleById } from "@/lib/edge-site/training-catalog";

type Props = { params: Promise<{ moduleId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { moduleId } = await params;
  const module = getModuleById(moduleId);
  if (!module) return { title: "Formation | EDGE Business" };
  return {
    title: `${module.title} | EDGE Business`,
    description: module.objectives.join(" · "),
  };
}

export default async function Page({ params }: Props) {
  const { moduleId } = await params;
  const module = getModuleById(moduleId);
  if (!module) notFound();

  return (
    <EdgePremiumShell overlayNav={false}>
      <EdgeTrainingDetailPage module={module} />
    </EdgePremiumShell>
  );
}
