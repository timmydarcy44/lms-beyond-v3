import Image from "next/image";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { BadgeMetadataCard } from "@/components/openbadges/badge-metadata-card";

export default async function BadgeViewerPage({
  params,
}: {
  params: { assertionId: string };
}) {
  const assertion = await prisma.assertion.findUnique({
    where: { id: params.assertionId },
    include: { badgeClass: true },
  });

  if (!assertion) {
    return <div className="p-10 text-center text-slate-600">Badge introuvable.</div>;
  }

  const hostedUrl =
    assertion.hostedUrl ??
    `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/public/assertions/${assertion.id}`;

  const imageUrl = assertion.bakedImageUrl ?? assertion.badgeClass.imageTemplateUrl;
  const requestHeaders = await headers();
  const userRole = requestHeaders.get("x-user-role");
  const userId = requestHeaders.get("x-user-id");
  const orgId = requestHeaders.get("x-org-id");
  const revokeContext =
    userRole === "SUPER_ADMIN" && userId && orgId
      ? { assertionId: assertion.id, userId, orgId }
      : undefined;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 p-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="relative h-[360px] w-[360px] overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <Image src={imageUrl} alt={assertion.badgeClass.name} fill className="object-contain" />
          </div>
          <a
            href={imageUrl}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
            download
          >
            Download
          </a>
        </div>
      </div>

      <BadgeMetadataCard
        hostedUrl={hostedUrl}
        bakedImageUrl={assertion.bakedImageUrl}
        revokeContext={revokeContext}
      />
    </div>
  );
}
