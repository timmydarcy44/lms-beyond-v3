"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateOrganisationModal } from "@/components/onboarding/create-organisation-modal";
import type { PipelineDeal } from "@/lib/crm/pipeline-shared";
import {
  canCreateOrganisation,
  hasOrganisationLink,
} from "@/lib/onboarding/deal-stages";

export default function PipelineBtobDealPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [deal, setDeal] = useState<PipelineDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/crm/pipeline/deals/${id}`);
      const json = (await res.json()) as { deal?: PipelineDeal; error?: string };
      if (!res.ok) throw new Error(json.error);
      setDeal(json.deal ?? null);
    } catch {
      setDeal(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) void load();
  }, [id]);

  if (loading) {
    return <p className="p-8 text-sm text-gray-500">Chargement…</p>;
  }

  if (!deal) {
    return (
      <div className="p-8">
        <p className="text-red-600">Fiche introuvable</p>
        <Link href="/super/crm/pipeline" className="text-sm text-indigo-600 underline mt-4 inline-block">
          Retour au pipeline
        </Link>
      </div>
    );
  }

  const orgId = deal.organization_id ?? null;
  const showCreate = canCreateOrganisation(deal.stage_slug, orgId);
  const showLink = hasOrganisationLink(orgId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Link
        href="/super/crm/pipeline"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Pipeline BTOB
      </Link>

      <header className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Prospect</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{deal.company_name}</h1>
        <p className="mt-2 text-sm text-gray-600">
          {deal.contact_first_name}
          {deal.email ? ` · ${deal.email}` : ""}
        </p>
        <p className="mt-1 text-xs text-gray-500">Étape : {deal.stage_slug}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {showCreate ? (
            <Button onClick={() => setModalOpen(true)}>🚀 Créer l&apos;organisation Beyond →</Button>
          ) : null}
          {showLink && orgId ? (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/entreprise?org=${orgId}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Accéder à l&apos;espace client
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      {deal.notes ? (
        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-semibold text-gray-900">Notes</p>
          <p className="mt-2 whitespace-pre-wrap">{deal.notes}</p>
        </section>
      ) : null}

      <CreateOrganisationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        deal={deal}
        onSuccess={() => void load()}
      />
    </div>
  );
}
