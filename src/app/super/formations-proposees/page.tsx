import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormationProposalsReview } from "@/components/super-admin/formation-proposals-review";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { listFormationProposalsForReview } from "@/lib/expert/formation-proposals";

export const metadata: Metadata = { title: "Propositions de formations" };
export const dynamic = "force-dynamic";

export default async function FormationProposalsPage() {
  if (!(await isSuperAdmin())) redirect("/unauthorized");
  const { rows, missing } = await listFormationProposalsForReview();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Propositions de formations</h1>
      <p className="mt-2 text-sm text-slate-500">
        Les experts envoient ici une formation à intégrer au catalogue. Valider n&apos;ajoute pas encore la formation : elle reste à créer dans le studio.
      </p>
      {missing ? (
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          La table n&apos;existe pas encore. Collez supabase/migrations/20261030123000_expert_formation_proposals.sql dans le SQL Editor Supabase.
        </p>
      ) : (
        <div className="mt-6">
          <FormationProposalsReview proposals={rows} />
        </div>
      )}
    </div>
  );
}
