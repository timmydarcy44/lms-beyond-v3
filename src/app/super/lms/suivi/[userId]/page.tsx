import Link from "next/link";
import { LmsSuiviDetailV2 } from "@/components/super-admin/lms-suivi-detail-v2";
import { loadLearnerSuiviDetail } from "@/lib/lms/learner-suivi-detail";

export const dynamic = "force-dynamic";

export default async function LearnerSuiviDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams?: Promise<{ courseId?: string }>;
}) {
  const { userId } = await params;
  const sp = searchParams ? await searchParams : {};
  const detail = await loadLearnerSuiviDetail(userId, sp.courseId ?? null);

  if (!detail) {
    return (
      <main className="p-8 text-white" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
        <p>Apprenant introuvable.</p>
        <Link href="/super/lms/suivi" className="mt-4 inline-block text-[#A99BFF]">
          ‹ Suivi des apprenants
        </Link>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 sm:px-8" style={{ background: "transparent" }}>
      <LmsSuiviDetailV2 key={`${detail.userId}-${detail.courseId ?? "none"}`} initial={detail} />
    </main>
  );
}
