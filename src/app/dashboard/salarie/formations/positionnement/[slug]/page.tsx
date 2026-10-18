import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/auth/session";
import { listSalarieEnterpriseFormations } from "@/lib/salarie/enterprise-formations";
import { SALARIE_PAGE_SHELL, SALARIE_PAGE_TITLE } from "@/lib/salarie/connect-nav";

export const dynamic = "force-dynamic";

export default async function SalariePositionnementPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSession();
  if (!session?.id) redirect("/login?next=/dashboard/salarie/formations");
  const { slug } = await params;
  const formations = await listSalarieEnterpriseFormations({
    userId: session.id,
    email: session.email ?? null,
  });
  const formation = formations.find((item) => item.slug === slug);
  if (!formation) notFound();

  return (
    <div className={`${SALARIE_PAGE_SHELL} max-w-2xl`}>
      <p className="text-sm text-white/45">Test de positionnement</p>
      <h1 className={`${SALARIE_PAGE_TITLE} mt-2`}>{formation.title}</h1>
      <p className="mt-3 text-sm text-white/60">
        {formation.positioningDone
          ? "Ce test est déjà passé. Les résultats sont dans vos badges."
          : "Répondez à ce positionnement avant la session. Le questionnaire s’ouvre avec la convocation."}
      </p>
      <ul className="mt-6 list-disc space-y-1 pl-5 text-sm text-white/75">
        {formation.objectives.map((objective) => (
          <li key={objective}>{objective}</li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-white/50">
        {formation.trainer} · {formation.date} · {formation.time} · {formation.place}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {formation.positioningDone ? (
          <Link href="/dashboard/salarie/badges" className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white">
            Résultats du test de positionnement
          </Link>
        ) : (
          <p className="text-sm text-white/70">Le questionnaire s’ouvre avec la convocation de session.</p>
        )}
        <Link href="/dashboard/salarie/formations" className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80">
          Retour aux formations
        </Link>
      </div>
    </div>
  );
}
