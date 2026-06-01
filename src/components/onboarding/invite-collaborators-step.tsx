"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type InviteCollaboratorsStepProps = {
  organisationId: string;
  companyName: string;
  importedCount: number;
  sansEmail: number;
  onFinish: () => void;
};

export function InviteCollaboratorsStep({
  organisationId,
  companyName,
  importedCount,
  sansEmail,
  onFinish,
}: InviteCollaboratorsStepProps) {
  const [loading, setLoading] = useState(false);
  const withEmail = Math.max(0, importedCount - sansEmail);

  const sendInvites = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/invite-collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisation_id: organisationId }),
      });
      const json = (await res.json()) as { error?: string; sent?: number };
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      toast.success(`${json.sent ?? 0} invitation(s) envoyée(s)`);
      onFinish();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">✉️ Inviter vos collaborateurs</h2>
      <p className="mt-4 text-sm text-gray-700">
        <strong>{importedCount}</strong> collaborateurs importés
        <br />
        <strong>{withEmail}</strong> ont une adresse email valide
      </p>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-600">
        <li>Comment accéder à Beyond</li>
        <li>Passer leur premier diagnostic (~10 min)</li>
        <li>Accéder à leurs formations</li>
      </ul>
      <p className="mt-2 text-xs text-gray-500">Organisation : {companyName}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={() => void sendInvites()} disabled={loading || withEmail === 0}>
          {loading ? "Envoi…" : "Envoyer les invitations →"}
        </Button>
        <Button variant="outline" onClick={onFinish} disabled={loading}>
          Passer — inviter plus tard
        </Button>
      </div>
    </section>
  );
}
