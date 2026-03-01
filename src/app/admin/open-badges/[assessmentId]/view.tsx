"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type AuthContext = {
  userId: string;
  orgId: string;
  role: string;
} | null;

type DetailPayload = {
  assessment: {
    id: string;
    status: string;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
  };
  earner: { id: string; displayName?: string | null };
  badgeClass: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    criteriaMarkdown: string;
    criteriaUrl?: string | null;
    issuerProfile: { name: string; url?: string | null; imageUrl?: string | null };
    requiresEnrollment: boolean;
    requiredCourseId?: string | null;
  };
  receivability?: {
    expectedModalities: string;
    aiEvaluationPrompt: string;
  } | null;
  criteria: Array<{ id: string; label: string; description?: string | null; sortOrder: number }>;
  evidences: Array<{
    type: string;
    url?: string | null;
    title?: string | null;
    description?: string | null;
    createdAt: string;
  }>;
  issued?: { assertionId: string; assertionUrl: string; downloadUrl: string } | null;
};

export default function OpenBadgeAssessmentDetail({
  auth,
  assessmentId,
}: {
  auth: AuthContext;
  assessmentId: string;
}) {
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!auth) return;
      const res = await fetch(`/api/admin/open-badges/assessments/${assessmentId}`, {
        headers: {
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
          "x-user-role": auth.role,
        },
      });
      if (!res.ok) return;
      const json = await res.json();
      setDetail(json);
      setNote(json?.assessment?.notes ?? "");
    };
    load();
  }, [auth, assessmentId]);

  const refresh = async () => {
    if (!auth) return;
    const res = await fetch(`/api/admin/open-badges/assessments/${assessmentId}`, {
      headers: {
        "x-user-id": auth.userId,
        "x-org-id": auth.orgId,
        "x-user-role": auth.role,
      },
    });
    if (!res.ok) return;
    const json = await res.json();
    setDetail(json);
    setNote(json?.assessment?.notes ?? "");
  };

  const submitDecision = async (status: "NEEDS_INFO" | "REJECTED" | "APPROVED") => {
    if (!auth) return;
    if (status === "NEEDS_INFO" && note.trim().length === 0) {
      toast.error("La note est obligatoire pour demander des infos.");
      return;
    }
    setLoading(true);
    const res = await fetch(
      `/api/admin/open-badges/assessments/${assessmentId}/decision`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": auth.userId,
          "x-org-id": auth.orgId,
          "x-user-role": auth.role,
        },
        body: JSON.stringify({ status, note: note.length > 0 ? note : null }),
      },
    );
    const json = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      toast.error(json?.error ?? "Erreur de décision");
      return;
    }

    toast.success(status === "APPROVED" ? "Badge émis" : "Décision enregistrée");
    await refresh();
  };

  if (!auth) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Organisation introuvable pour cet admin.
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Chargement...
      </div>
    );
  }

  const statusLabel = detail.issued ? "ISSUED" : detail.assessment.status;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Open Badges</p>
          <h1 className="text-2xl font-semibold text-slate-900">{detail.badgeClass.name}</h1>
          <p className="text-sm text-slate-600">{detail.badgeClass.description}</p>
        </div>
        <Badge variant="secondary">{statusLabel}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Badge</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <div>Issuer: {detail.badgeClass.issuerProfile.name}</div>
          {detail.badgeClass.criteriaUrl ? (
            <Link className="text-blue-600 underline" href={detail.badgeClass.criteriaUrl} target="_blank">
              Voir les critères
            </Link>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Critères</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
            {detail.badgeClass.criteriaMarkdown}
          </pre>
          <ul className="list-disc space-y-2 pl-6 text-sm text-slate-700">
            {detail.criteria.map((criterion) => (
              <li key={criterion.id}>
                <div className="font-medium">{criterion.label}</div>
                {criterion.description ? <div className="text-slate-600">{criterion.description}</div> : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modalités attendues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-700">
          <div>{detail.receivability?.expectedModalities ?? "N/A"}</div>
          <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
            {detail.receivability?.aiEvaluationPrompt ?? "N/A"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preuves</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          {detail.evidences.length === 0 ? (
            <div>Aucune preuve.</div>
          ) : (
            detail.evidences.map((evidence, index) => (
              <div key={`${evidence.type}-${index}`} className="rounded-lg border border-slate-200 p-3">
                <div className="font-medium">{evidence.title ?? evidence.type}</div>
                {evidence.description ? <div className="text-slate-600">{evidence.description}</div> : null}
                {evidence.url ? (
                  <a href={evidence.url} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                    {evidence.url}
                  </a>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Décision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">Note à l’apprenant</p>
            <Textarea
              placeholder="Note visible dans l’espace apprenant"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => submitDecision("NEEDS_INFO")}
            >
              Demander des infos
            </Button>
            <Button
              variant="outline"
              disabled={loading}
              onClick={() => submitDecision("REJECTED")}
            >
              Rejeter
            </Button>
            <Button
              disabled={loading}
              onClick={() => submitDecision("APPROVED")}
            >
              Approuver & émettre
            </Button>
          </div>
        </CardContent>
      </Card>

      {detail.issued ? (
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/badges/${detail.issued.assertionId}`}>Voir le badge</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={detail.issued.downloadUrl} target="_blank">
              Exporter
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
