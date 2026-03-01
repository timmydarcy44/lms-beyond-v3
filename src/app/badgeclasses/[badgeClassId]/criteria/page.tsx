import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/openbadges/urls";

export const revalidate = 600;

type RouteParams = { params: { badgeClassId: string } };

export default async function BadgeCriteriaPage({ params }: RouteParams) {
  const badgeClass = await prisma.badgeClass.findUnique({
    where: { id: params.badgeClassId },
    include: {
      issuer: true,
      organization: true,
      criteria: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!badgeClass || badgeClass.status !== "ACTIVE") {
    notFound();
  }

  const issuerLink = badgeClass.issuer.url?.trim()
    ? badgeClass.issuer.url
    : `${getBaseUrl().replace(/\/$/, "")}/api/public/issuers/${badgeClass.issuerId}`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-slate-900">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Critères du badge
        </p>
        <h1 className="text-3xl font-semibold">{badgeClass.name}</h1>
        <p className="text-base text-slate-700">{badgeClass.description}</p>
      </div>

      <div className="mt-6 space-y-1 text-sm text-slate-700">
        <div>
          Issuer:{" "}
          <Link className="underline" href={issuerLink} target="_blank">
            {badgeClass.issuer.name}
          </Link>
        </div>
        {badgeClass.organization ? (
          <div>Organisation: {badgeClass.organization.name}</div>
        ) : null}
      </div>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">Critères (narrative)</h2>
        <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
          {badgeClass.criteriaMarkdown ?? ""}
        </pre>
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">Critères structurés</h2>
        {badgeClass.criteria.length ? (
          <ol className="list-decimal space-y-2 pl-6 text-sm text-slate-800">
            {badgeClass.criteria.map((criterion) => (
              <li key={criterion.id}>
                <div className="font-medium">{criterion.label}</div>
                {criterion.description ? (
                  <div className="text-slate-600">{criterion.description}</div>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-600">Aucun critère structuré.</p>
        )}
      </section>
    </main>
  );
}
