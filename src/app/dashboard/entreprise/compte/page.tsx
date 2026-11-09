"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/components/providers/supabase-provider";
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
  siret?: string | null;
  address_line?: string | null;
  address_zip?: string | null;
  address_city?: string | null;
  address_country?: string | null;
  opco_name?: string | null;
  hasPassword?: boolean;
};

const fieldClass =
  "rounded-2xl border border-gray-200 px-4 py-2.5 outline-none focus:border-violet-400";
const disabledClass =
  "rounded-2xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-gray-500";

export default function EntrepriseComptePage() {
  const [data, setData] = useState<AccountData | null>(null);
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [addressZip, setAddressZip] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [opcoName, setOpcoName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const supabase = useSupabase();

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
        const account = json as AccountData;
        setData(account);
        setPrenom(String(account.prenom ?? ""));
        setNom(String(account.nom ?? ""));
        setPhone(String(account.phone ?? ""));
        setCompanyName(String(account.organisationName ?? ""));
        setSiret(String(account.siret ?? ""));
        setAddressLine(String(account.address_line ?? ""));
        setAddressZip(String(account.address_zip ?? ""));
        setAddressCity(String(account.address_city ?? ""));
        setOpcoName(String(account.opco_name ?? "").trim() || null);
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
          company_name: companyName,
          siret,
          address_line: addressLine,
          address_zip: addressZip,
          address_city: addressCity,
          address_country: "FR",
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
              organisationName: json.organisationName ?? companyName,
              siret: json.siret ?? siret.replace(/\D/g, ""),
              address_line: json.address_line ?? addressLine,
              address_zip: json.address_zip ?? addressZip,
              address_city: json.address_city ?? addressCity,
            }
          : prev,
      );
      setSiret(String(json.siret ?? siret.replace(/\D/g, "")));
      setOpcoName(String(json.opco_name ?? "").trim() || null);
      toast.success("Compte mis à jour — ces infos alimentent devis et convention.");
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
      "Confirmer la demande d’effacement de vos données personnelles ? Byound traitera la demande sous 30 jours.",
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
            Identité du gestionnaire, SIRET et adresse postale — repris sur devis, convention et
            documents de formation. L’email n’est pas modifiable ici.
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
              <section className="space-y-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Entreprise
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Ces informations apparaissent sur le devis et la convention.
                  </p>
                </div>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-gray-700">Raison sociale</span>
                  <input
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-gray-700">SIRET</span>
                  <input
                    required
                    inputMode="numeric"
                    value={siret}
                    onChange={(e) => setSiret(e.target.value.replace(/[^\d\s]/g, ""))}
                    placeholder="14 chiffres"
                    className={fieldClass}
                  />
                </label>
                {opcoName ? (
                  <p className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs leading-5 text-violet-800">
                    OPCO détecté : <strong>{opcoName}</strong> — reporté automatiquement sur les
                    devis en prise en charge OPCO.
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">
                    L’OPCO sera détecté automatiquement à l’enregistrement du SIRET (CFADock / IDCC).
                  </p>
                )}
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-gray-700">Adresse postale</span>
                  <input
                    required
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="N° et rue"
                    autoComplete="street-address"
                    className={fieldClass}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-semibold text-gray-700">Code postal</span>
                    <input
                      required
                      value={addressZip}
                      onChange={(e) => setAddressZip(e.target.value)}
                      placeholder="14000"
                      autoComplete="postal-code"
                      className={fieldClass}
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-semibold text-gray-700">Ville</span>
                    <input
                      required
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      placeholder="Caen"
                      autoComplete="address-level2"
                      className={fieldClass}
                    />
                  </label>
                </div>
              </section>

              <section className="mt-8 space-y-4 border-t border-gray-100 pt-8">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Gestionnaire du compte
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Contact signataire repris sur les documents (représentant de l’entreprise).
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-semibold text-gray-700">Prénom</span>
                    <input
                      required
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className={fieldClass}
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-semibold text-gray-700">Nom</span>
                    <input
                      required
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className={fieldClass}
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm sm:col-span-2">
                    <span className="font-semibold text-gray-700">
                      Email <span className="font-normal text-gray-400">(non modifiable)</span>
                    </span>
                    <input value={data?.email ?? ""} disabled className={disabledClass} />
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-semibold text-gray-700">Téléphone</span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="06…"
                      className={fieldClass}
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-semibold text-gray-700">Rôle</span>
                    <input value={String(roleLabel)} disabled className={disabledClass} />
                  </label>
                </div>
              </section>

              <button
                type="submit"
                disabled={saving}
                className="mt-6 inline-flex rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </form>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!supabase || password.length < 6) {
                  toast.error("Le mot de passe doit contenir au moins 6 caractères.");
                  return;
                }
                setSavingPassword(true);
                void (async () => {
                  const { data: auth } = await supabase.auth.getUser();
                  const email = auth.user?.email;
                  if (data?.hasPassword) {
                    if (!email || !currentPassword) {
                      toast.error("Indiquez le mot de passe actuel.");
                      setSavingPassword(false);
                      return;
                    }
                    const { error: signInError } = await supabase.auth.signInWithPassword({
                      email,
                      password: currentPassword,
                    });
                    if (signInError) {
                      toast.error("Mot de passe actuel incorrect.");
                      setSavingPassword(false);
                      return;
                    }
                  }
                  const { error: updateError } = await supabase.auth.updateUser({
                    password,
                    data: { needs_password_setup: false },
                  });
                  setSavingPassword(false);
                  if (updateError) {
                    toast.error(updateError.message || "Impossible d'enregistrer le mot de passe.");
                    return;
                  }
                  setPassword("");
                  setCurrentPassword("");
                  setData((current) => (current ? { ...current, hasPassword: true } : current));
                  toast.success(
                    data?.hasPassword ? "Mot de passe modifié." : "Mot de passe défini.",
                  );
                })();
              }}
              className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="text-lg font-bold text-gray-950">
                {data?.hasPassword ? "Modifier mon mot de passe" : "Définir un mot de passe"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Facultatif. Vous pouvez continuer à vous connecter avec un code.
              </p>
              <div className="mt-4 grid gap-4">
                {data?.hasPassword ? (
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-semibold text-gray-700">Mot de passe actuel</span>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className={fieldClass}
                    />
                  </label>
                ) : null}
                <label className="grid gap-1.5 text-sm">
                  <span className="font-semibold text-gray-700">
                    {data?.hasPassword ? "Nouveau mot de passe" : "Mot de passe"}
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={fieldClass}
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={savingPassword}
                className="mt-5 inline-flex rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {savingPassword
                  ? "Enregistrement…"
                  : data?.hasPassword
                    ? "Modifier mon mot de passe"
                    : "Définir un mot de passe"}
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
