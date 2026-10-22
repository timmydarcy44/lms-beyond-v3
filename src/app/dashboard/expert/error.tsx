"use client";

import Link from "next/link";

export default function ExpertDashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-start justify-center gap-4 px-6 text-[#04140C]">
      <h1 className="text-2xl font-semibold">L&apos;espace expert ne s&apos;est pas ouvert</h1>
      <p className="text-sm text-[#3A3D45]">
        La page a rencontré une erreur. Vous pouvez réessayer, ou revenir à l&apos;administration.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-[#FF4B4B] px-4 py-2 text-sm font-semibold text-[#04140C]"
        >
          Réessayer
        </button>
        <Link href="/super" className="rounded-full border border-[#E3E0D8] bg-white px-4 py-2 text-sm font-semibold">
          Administration
        </Link>
      </div>
    </div>
  );
}
