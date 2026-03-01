"use client";

import { useState } from "react";
import { verifyHostedAssertion } from "@/lib/openbadges/verify";

type BadgeMetadataCardProps = {
  hostedUrl: string;
  bakedImageUrl?: string | null;
  revokeContext?: {
    assertionId: string;
    userId: string;
    orgId: string;
  };
};

type AssertionSummary = {
  id: string;
  badge: string;
  issuer: string;
  issuedOn: string;
  expires?: string;
  verification?: { type: string; url?: string };
  evidence?: Array<{ id: string }>;
  narrative?: string;
  revoked?: boolean;
  revocationReason?: string;
};

export function BadgeMetadataCard({ hostedUrl, bakedImageUrl, revokeContext }: BadgeMetadataCardProps) {
  const [assertion, setAssertion] = useState<AssertionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inspectResult, setInspectResult] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; reasons: string[] } | null>(
    null,
  );
  const [revokeStatus, setRevokeStatus] = useState<string | null>(null);

  const fetchAssertion = async () => {
    setError(null);
    const res = await fetch(hostedUrl);
    const json = (await res.json()) as AssertionSummary;
    if (!res.ok) {
      setError("Impossible de récupérer l'assertion.");
      return;
    }
    setAssertion(json);
  };

  const verify = async () => {
    setError(null);
    const result = await verifyHostedAssertion(hostedUrl);
    setVerifyResult(result);
    if (!result.ok) {
      setError(result.reasons.join(", "));
      return;
    }
    await fetchAssertion();
  };

  const inspectBaked = async () => {
    if (!bakedImageUrl) return;
    const res = await fetch(`${hostedUrl}/inspect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: bakedImageUrl }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Inspection impossible");
      return;
    }
    setInspectResult(json.value ?? null);
  };

  const revokeAssertion = async () => {
    if (!revokeContext) return;
    const reason = window.prompt("Raison de révocation (obligatoire):") ?? "";
    if (!reason.trim()) return;

    setError(null);
    setRevokeStatus(null);

    const response = await fetch(
      `/api/admin/assertions/${revokeContext.assertionId}/revoke`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": revokeContext.userId,
          "x-org-id": revokeContext.orgId,
          "x-user-role": "SUPER_ADMIN",
        },
        body: JSON.stringify({ reason }),
      },
    );

    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Révocation impossible");
      return;
    }
    setRevokeStatus("Révoqué");
    await fetchAssertion();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Métadonnées</p>
          <h3 className="text-lg font-semibold">Badge Metadata</h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={verify}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
          >
            Verify
          </button>
          {revokeContext ? (
            <button
              type="button"
              onClick={revokeAssertion}
              className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
            >
              Révoquer
            </button>
          ) : null}
          {bakedImageUrl ? (
            <button
              type="button"
              onClick={inspectBaked}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
            >
              Inspect baked
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {revokeStatus ? <p className="mt-2 text-xs text-rose-600">{revokeStatus}</p> : null}
      {verifyResult ? (
        <p className={`mt-2 text-xs ${verifyResult.ok ? "text-emerald-600" : "text-red-600"}`}>
          {verifyResult.ok ? "Verification OK" : `Verification failed: ${verifyResult.reasons.join(", ")}`}
        </p>
      ) : null}

      {assertion ? (
        <div className="mt-4 space-y-2 text-sm">
          <div>
            <span className="font-semibold">Assertion</span>: {assertion.id}
          </div>
          <div>
            <span className="font-semibold">Badge</span>: {assertion.badge}
          </div>
          <div>
            <span className="font-semibold">Issuer</span>: {assertion.issuer}
          </div>
          <div>
            <span className="font-semibold">Issued</span>: {assertion.issuedOn}
          </div>
          {assertion.expires ? (
            <div>
              <span className="font-semibold">Expires</span>: {assertion.expires}
            </div>
          ) : null}
          <div>
            <span className="font-semibold">Verification</span>: {assertion.verification?.type}
          </div>
          {assertion.revoked ? (
            <div className="text-red-600">
              Révoqué: {assertion.revocationReason ?? "N/A"}
            </div>
          ) : null}
          {assertion.evidence?.length ? (
            <div>
              <span className="font-semibold">Evidence</span>:
              <ul className="list-disc pl-4">
                {assertion.evidence.map((ev) => (
                  <li key={ev.id}>
                    <a href={ev.id} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                      {ev.id}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {assertion.narrative ? (
            <div>
              <span className="font-semibold">Narrative</span>: {assertion.narrative}
            </div>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          onClick={fetchAssertion}
          className="mt-4 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
        >
          Charger l'assertion
        </button>
      )}

      {inspectResult ? (
        <p className="mt-4 text-xs text-slate-500">Baked verify: {inspectResult}</p>
      ) : null}
    </div>
  );
}
