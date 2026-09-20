"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EmargerPage() {
  const params = useParams();
  const token = String(params.token ?? "");
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<{
    authenticated?: boolean;
    phase?: string;
    expires_at?: string;
    slot?: {
      starts_at?: string;
      ends_at?: string;
      module?: { name?: string } | null;
      class?: { name?: string } | null;
      instructor?: { first_name?: string; last_name?: string } | null;
    } | null;
    error?: string;
  } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/emarger/${token}`);
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(
        json.error === "EXPIRED"
          ? "Ce QR code a expiré."
          : "QR code invalide.",
      );
      return;
    }
    setInfo(json);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/emarger/${token}`, { method: "POST", credentials: "include" });
    const json = await res.json();
    setSubmitting(false);
    if (res.status === 401) {
      setError("AUTH_REQUIRED");
      return;
    }
    if (!res.ok) {
      setError(
        json.error === "ALREADY_CHECKED_IN"
          ? "Vous avez déjà émargé l’entrée."
          : json.error === "ALREADY_CHECKED_OUT"
            ? "Vous avez déjà émargé la sortie."
            : json.error === "NOT_ENROLLED"
              ? "Vous n’êtes pas inscrit à cette classe."
              : json.error || "Émargement impossible",
      );
      return;
    }
    setResult(json.status || "Émargement enregistré");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05060a] text-white/50">
        Vérification du QR…
      </div>
    );
  }

  const slot = info?.slot;
  const instructor = slot?.instructor
    ? `${slot.instructor.first_name ?? ""} ${slot.instructor.last_name ?? ""}`.trim()
    : "Formateur";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05060a] px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <p className="text-sm font-semibold tracking-wide text-white/45">
          <span className="font-extrabold text-white">EDGE</span> Émargement
        </p>
        {error && error !== "AUTH_REQUIRED" ? (
          <p className="mt-6 text-amber-200">{error}</p>
        ) : null}
        {result ? (
          <>
            <h1 className="mt-6 text-2xl font-bold text-emerald-300">{result}</h1>
            <p className="mt-2 text-sm text-white/45">Horodatage enregistré sur votre compte.</p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-2xl font-bold">
              {info?.phase === "checkout" ? "Émargement sortie" : "Émargement entrée"}
            </h1>
            <div className="mt-4 space-y-1 text-sm text-white/60">
              <p className="font-semibold text-white">{slot?.class?.name ?? "Classe"}</p>
              <p>{slot?.module?.name ?? "Cours"}</p>
              <p>
                {slot?.starts_at
                  ? new Date(slot.starts_at).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
                {slot?.ends_at
                  ? ` → ${new Date(slot.ends_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : ""}
              </p>
              <p>{instructor}</p>
            </div>
            {!info?.authenticated || error === "AUTH_REQUIRED" ? (
              <div className="mt-6 space-y-3">
                <p className="text-sm text-amber-200">
                  Connectez-vous à votre compte EDGE pour valider l’émargement.
                </p>
                <Link
                  href={`/login?next=${encodeURIComponent(`/emarger/${token}`)}`}
                  className="inline-flex rounded-xl bg-[#3D7BFF] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Se connecter
                </Link>
              </div>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submit()}
                className="mt-6 w-full rounded-xl bg-[#3D7BFF] py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {submitting ? "Validation…" : "Confirmer mon émargement"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
