import Link from "next/link";
import { ExpertPageFrame, ExpertPageHeader } from "@/components/expert/expert-ui";
import { getSession } from "@/lib/auth/session";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TESTS = [
  {
    id: "soft_skills",
    title: "Soft skills",
    detail: "12 compétences transverses — utile pour Qualiopi (compétences des intervenants).",
    href: "/soft-skills/test?from=expert",
    resultHref: "/soft-skills/resultats?from=expert",
  },
  {
    id: "disc",
    title: "DISC",
    detail: "Profil comportemental — mieux adapter posture et animation.",
    href: "/disc/test?from=expert",
    resultHref: "/dashboard/expert/resultats",
  },
  {
    id: "idmc",
    title: "IDMC",
    detail: "Motivations et moteurs d’engagement.",
    href: "/idmc/test?from=expert",
    resultHref: "/dashboard/expert/bilans",
  },
] as const;

export default async function ExpertBilansPage() {
  const session = await getSession();
  const db = getServiceRoleClient();
  const userId = session?.id ?? null;

  let softDone = false;
  let discDone = false;
  let idmcDone = false;
  if (userId && db) {
    const [soft, disc, idmc] = await Promise.all([
      db.from("soft_skills_resultats").select("learner_id").eq("learner_id", userId).maybeSingle(),
      db.from("disc_resultats").select("profile_id").eq("profile_id", userId).maybeSingle(),
      db.from("idmc_resultats").select("profile_id").eq("profile_id", userId).maybeSingle(),
    ]);
    softDone = Boolean(soft.data);
    discDone = Boolean(disc.data);
    idmcDone = Boolean(idmc.data);
  }

  const doneMap: Record<string, boolean> = {
    soft_skills: softDone,
    disc: discDone,
    idmc: idmcDone,
  };

  return (
    <ExpertPageFrame>
      <ExpertPageHeader
        title="Mes bilans"
        subtitle="Passez les tests soft skills, DISC et IDMC — preuves pour les compétences des intervenants."
      />
      <ul className="space-y-3">
        {TESTS.map((test) => {
          const done = doneMap[test.id];
          return (
            <li key={test.id} className="rounded-[28px] bg-[#12141A] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-extrabold text-[#F4F5F7]">{test.title}</p>
                  <p className="mt-1 text-sm text-[#B5BAC6]">{test.detail}</p>
                  <p className="mt-2 text-xs font-bold text-[#8DB8FF]">
                    {done ? "Déjà passé — vous pouvez le refaire" : "À passer"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {done ? (
                    <Link
                      href={test.resultHref}
                      className="rounded-full border border-white/15 px-4 py-2 text-sm font-extrabold text-[#F4F5F7]"
                    >
                      Voir le résultat
                    </Link>
                  ) : null}
                  <Link
                    href={test.href}
                    className="rounded-full bg-[#F4F5F7] px-4 py-2 text-sm font-extrabold text-[#12141A]"
                  >
                    {done ? "Repasser" : "Commencer"}
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </ExpertPageFrame>
  );
}
