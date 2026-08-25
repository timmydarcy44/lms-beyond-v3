"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import EnterpriseSidebar, {
  invalidateEnterpriseViewerCache,
} from "@/components/EnterpriseSidebar";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import { Download, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

type AccountData = {
  prenom: string | null;
  nom: string | null;
  email: string | null;
  phone: string | null;
  userId?: string;
  company_id?: string | null;
  role?: string | null;
  role_type?: string | null;
  organisationName?: string | null;
};

export default function EntrepriseComptePage() {
  const [data, setData] = useState<AccountData | null>(null);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/dashboard/entreprise/account");
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(String(json.error ?? "Impossible de charger votre compte."));
          return;
        }
        setData(json as AccountData);
        setPrenom(String(json.prenom ?? ""));
        setNom(String(json.nom ?? ""));
        setPhone(String(json.phone ?? ""));
      } catch {
        if (!cancelled) setError("Erreur réseau.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/entreprise/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: prenom,
          last_name: nom,
          phone,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(String(json.error ?? "Enregistrement impossible."));
        return;
      }
      invalidateEnterpriseViewerCache();
      setData((prev) =>
        prev
          ? {
              ...prev,
              prenom: json.prenom ?? prenom,
              nom: json.nom ?? nom,
              phone: json.phone ?? phone,
            }
          : prev,
      );
      toast.success("Profil mis à jour.");
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/dashboard/entreprise/rgpd");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(String(json.error ?? "Export impossible."));
        return;
      }
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edge-rgpd-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export RGPD téléchargé.");
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setExporting(false);
    }
  };

  const requestErasure = async () => {
    const ok = window.confirm(
      "Confirmer la demande d’effacement de vos données personnelles ? EDGE traitera la demande sous 30 jours.",
    );
    if (!ok) return;
    setErasing(true);
    try {
      const res = await fetch("/api/dashboard/entreprise/rgpd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "erasure" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(String(json.error ?? "Demande impossible."));
        return;
      }
      toast.success(String(json.message ?? "Demande enregistrée."));
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setErasing(false);
    }
  };

  const roleLabel = data?.role_type || data?.role || "Responsable entreprise";

  return (
    <div className="flex min-h-screen bg-[#f7f5fb] text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-8 max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-500">
            Compte
          </p>
          <h1 className={`mt-2 text-left ${ENTREPRISE_H1_CLASS}`}>Mon compte</h1>
          <p className="mt-2 text-sm text-gray-500">
            Modifiez votre profil. L’adresse email n’est pas modifiable ici.
          </p>
        </header>

        {loading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : error ? (
          <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : (
          <div className="max-w-3xl space-y-6">
            <form
              onSubmit={save}
              className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-gray-700">Prénom</span>
                  <input
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="rounded-2xl border border-gray-200 px-4 py-2.5 outline-none focus:border-violet-400"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-gray-700">Nom</span>
                  <input
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="rounded-2xl border border-gray-200 px-4 py-2.5 outline-none focus:border-violet-400"
                  />
                </label>
                <label className="grid gap-1.5 text-sm sm:col-span-2">
                  <span className="font-semibold text-gray-700">
                    Email <span className="font-normal text-gray-400">(non modifiable)</span>
                  </span>
                  <input
                    value={data?.email ?? ""}
                    disabled
                    className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-gray-500"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-gray-700">Téléphone</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06…"
                    className="rounded-2xl border border-gray-200 px-4 py-2.5 outline-none focus:border-violet-400"
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-gray-700">Rôle</span>
                  <input
                    value={String(roleLabel)}
                    disabled
                    className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-gray-500"
                  />
                </label>
                <label className="grid gap-1.5 text-sm sm:col-span-2">
                  <span className="font-semibold text-gray-700">Organisation</span>
                  <input
                    value={data?.organisationName ?? ""}
                    disabled
                    className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-gray-500"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-6 inline-flex rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </form>

            <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 text-violet-600" />
                <div>
                  <h2 className="text-lg font-bold text-gray-950">Vos droits RGPD</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Accès, rectification, effacement — conformément au règlement européen.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void exportData()}
                  disabled={exporting}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? "Export…" : "Télécharger mes données"}
                </button>
                <button
                  type="button"
                  onClick={() => void requestErasure()}
                  disabled={erasing}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  {erasing ? "Envoi…" : "Demander la suppression"}
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-4 text-sm">
                <Link
                  href="/dashboard/entreprise/rgpd/confidentialite"
                  className="font-semibold text-violet-600 hover:text-violet-500"
                >
                  Politique de confidentialité →
                </Link>
                <Link
                  href="/dashboard/entreprise/rgpd/registre"
                  className="font-semibold text-violet-600 hover:text-violet-500"
                >
                  Registre des traitements →
                </Link>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
