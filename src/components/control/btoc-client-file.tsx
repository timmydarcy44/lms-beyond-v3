"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { BtocClientFile, BtocFundingType } from "@/lib/control/btoc-client-file";
import { isLot4Kind } from "@/lib/formation-documents/constants";
import type { CoffreItemStatus } from "@/lib/formation-documents/coffre";
import { ConnectionPresenceDot } from "@/components/ui/connection-presence-dot";

const CARD = "rounded-[26px] border border-[#1A2340] bg-[#111831]";
const MUTED = "text-[#9AA3BD]";
const INPUT =
  "mt-1.5 w-full rounded-xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm text-white outline-none focus:border-[#6E5BFF]";

const COFFRE_STATUS: Record<
  CoffreItemStatus,
  { label: string; bg: string; fg: string }
> = {
  missing: { label: "Absent", bg: "#3A1818", fg: "#FF8E8E" },
  partial: { label: "Incomplet", bg: "#3A3118", fg: "#F2CF6B" },
  ready: { label: "Déposé", bg: "#163228", fg: "#6BE39B" },
  not_due: { label: "Pas dû", bg: "#1A2340", fg: "#8A93AE" },
};

const FUNDING_LABEL: Record<BtocFundingType, string> = {
  fonds_propres: "Fonds propres",
  cpf: "CPF",
  autre: "Autre",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "B";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function lastConnexionTone(iso: string | null): { label: string; bg: string; fg: string } {
  if (!iso) return { label: "Jamais connecté", bg: "#1A2340", fg: "#8A93AE" };
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86400000);
  if (days <= 7) {
    const label =
      days <= 0 ? "Dernière connexion aujourd’hui" : days === 1 ? "Dernière connexion hier" : `Dernière connexion il y a ${days} j`;
    return { label, bg: "#163228", fg: "#6BE39B" };
  }
  return {
    label: `Dernière connexion il y a ${days} j`,
    bg: "#3A3118",
    fg: "#F2CF6B",
  };
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

type Props = {
  initial: BtocClientFile;
};

export function BtocClientFileView({ initial }: Props) {
  const [file, setFile] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    firstName: initial.firstName ?? "",
    lastName: initial.lastName ?? "",
    email: initial.email,
    phone: initial.phone ?? "",
    addressLine: initial.addressLine ?? "",
    postalCode: initial.postalCode ?? "",
    city: initial.city ?? "",
    fundingType: (initial.fundingType ?? "") as "" | BtocFundingType,
  });
  const [assignOpen, setAssignOpen] = useState(false);
  const [catalog, setCatalog] = useState<Array<{ id: string; title: string }>>([]);
  const [assignCourseId, setAssignCourseId] = useState("");
  const [assignReason, setAssignReason] = useState("offerte");
  const [assignBusy, setAssignBusy] = useState(false);
  const [selectedCoffre, setSelectedCoffre] = useState(0);
  const [coffreBusyKey, setCoffreBusyKey] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<{ dossierId: string; kind: string; itemKey: string } | null>(null);

  const conn = lastConnexionTone(file.lastSignInAt);
  const coffreReady = file.coffres.reduce((s, c) => s + c.ready_count, 0);
  const coffreTotal = file.coffres.reduce((s, c) => s + c.total_count, 0);
  const missingLabels = useMemo(() => {
    const labels: string[] = [];
    for (const c of file.coffres) {
      for (const item of c.items) {
        if (item.status === "missing" || item.status === "partial") labels.push(item.label);
      }
    }
    return [...new Set(labels)].slice(0, 4);
  }, [file.coffres]);

  const addressMissing = !file.addressLine?.trim() || !file.postalCode?.trim() || !file.city?.trim();

  const saveCoords = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/super/utilisateurs/${file.id}/btoc`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: draft.firstName.trim() || null,
          last_name: draft.lastName.trim() || null,
          email: draft.email.trim(),
          phone: draft.phone.trim() || null,
          address_line: draft.addressLine.trim() || null,
          postal_code: draft.postalCode.trim() || null,
          city: draft.city.trim() || null,
          funding_type: draft.fundingType || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
      if (json.client) {
        setFile((prev) => ({
          ...prev,
          ...json.client,
          fullName:
            [json.client.firstName, json.client.lastName].filter(Boolean).join(" ").trim() ||
            prev.fullName,
        }));
        setDraft({
          firstName: String(json.client.firstName ?? ""),
          lastName: String(json.client.lastName ?? ""),
          email: String(json.client.email ?? ""),
          phone: String(json.client.phone ?? ""),
          addressLine: String(json.client.addressLine ?? ""),
          postalCode: String(json.client.postalCode ?? ""),
          city: String(json.client.city ?? ""),
          fundingType: (json.client.fundingType ?? "") as "" | BtocFundingType,
        });
      }
      setEditing(false);
      if (json.warning) toast.message(String(json.warning));
      else toast.success("Coordonnées mises à jour");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const openAssign = async () => {
    setAssignOpen(true);
    if (catalog.length) return;
    try {
      const res = await fetch("/api/super/training-courses?limit=80");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Catalogue indisponible");
      const rows = (json.courses ?? json.items ?? []) as Array<{ id: string; title: string }>;
      setCatalog(rows.map((r) => ({ id: r.id, title: r.title })));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Catalogue indisponible");
    }
  };

  const submitAssign = async () => {
    if (!assignCourseId) {
      toast.error("Choisissez une formation");
      return;
    }
    setAssignBusy(true);
    try {
      const res = await fetch(`/api/super/utilisateurs/${file.id}/btoc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assign_formation",
          training_course_id: assignCourseId,
          reason: assignReason,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Assignation impossible");
      toast.success(
        json.positionnement_sent
          ? "Formation assignée — coffre ouvert · positionnement envoyé"
          : "Formation assignée — coffre ouvert",
      );
      setAssignOpen(false);
      if (json.client) setFile(json.client);
      else window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAssignBusy(false);
    }
  };

  const relance = async () => {
    try {
      const res = await fetch(`/api/super/utilisateurs/${file.id}/btoc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "relance_qualiopi", missing: missingLabels }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Relance impossible");
      toast.success(json.message || "Relance envoyée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const [passwordInviteBusy, setPasswordInviteBusy] = useState(false);
  const sendPasswordInvite = async () => {
    setPasswordInviteBusy(true);
    try {
      const res = await fetch(`/api/super/utilisateurs/${file.id}/btoc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_password_invite" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Envoi impossible");
      toast.success(json.message || "Demande de création de mot de passe envoyée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setPasswordInviteBusy(false);
    }
  };

  const activeCoffre = file.coffres[selectedCoffre] ?? null;

  const refreshClient = async () => {
    const res = await fetch(`/api/super/utilisateurs/${file.id}/btoc`);
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.client) setFile(json.client);
  };

  const sendCoffreDoc = async (dossierId: string, kind: string, itemKey: string) => {
    setCoffreBusyKey(`send:${itemKey}`);
    try {
      const res = await fetch(
        `/api/super-admin/crm/formation-dossiers/${dossierId}/documents/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, to: file.email }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Envoi impossible");
      toast.success(
        json.sent_to?.length
          ? `Envoyé en ligne à ${json.sent_to.join(", ")}`
          : "Document envoyé en ligne",
      );
      await refreshClient();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setCoffreBusyKey(null);
    }
  };

  const pickUpload = (dossierId: string, kind: string, itemKey: string) => {
    uploadTargetRef.current = { dossierId, kind, itemKey };
    // Ref synchrone : le state React n’est pas fiable avant le file picker.
    const input = uploadInputRef.current;
    if (!input) {
      toast.error("Sélecteur de fichier indisponible — rechargez la page.");
      return;
    }
    input.value = "";
    input.click();
  };

  const onUploadFile = async (fileList: FileList | null) => {
    const target = uploadTargetRef.current;
    const pdf = fileList?.[0];
    if (!pdf) return;
    if (!target) {
      toast.error("Cible d’upload perdue — réessayez.");
      return;
    }
    // Ne clear la cible qu’après validation fichier, pour pouvoir réessayer.
    const okType =
      pdf.type === "application/pdf" ||
      /\.pdf$/i.test(pdf.name) ||
      /^image\/(jpeg|jpg|png)$/i.test(pdf.type) ||
      /\.(jpe?g|png)$/i.test(pdf.name);
    if (!okType) {
      toast.error("PDF, JPEG ou PNG uniquement");
      return;
    }
    uploadTargetRef.current = null;
    setCoffreBusyKey(`upload:${target.itemKey}`);
    try {
      const form = new FormData();
      form.set("kind", target.kind);
      form.set("file", pdf);
      const res = await fetch(
        `/api/super-admin/crm/formation-dossiers/${target.dossierId}/documents/upload`,
        { method: "POST", body: form },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Upload impossible (${res.status})`);
      toast.success("Document déposé dans le coffre");
      await refreshClient();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload impossible");
    } finally {
      setCoffreBusyKey(null);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-8 sm:px-6">
      <Link href="/super/utilisateurs?role=btoc" className="inline-flex text-sm font-semibold text-[#9AA3BD] hover:text-white">
        ‹ Particuliers
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="relative grid h-16 w-16 shrink-0 place-items-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[#6E5BFF] to-[#2F7CF6] text-lg font-extrabold text-white">
              {initials(file.fullName)}
            </div>
            <ConnectionPresenceDot lastSignInAt={file.lastSignInAt} size="md" className="ring-[#0B1122]" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">{file.fullName}</h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#1A2A4A] px-3 py-1 text-xs font-semibold text-[#8DB8FF]">
                Particulier
              </span>
              <span className="rounded-full bg-[#1A2340] px-3 py-1 text-xs font-semibold text-[#C9D2E8]">
                Client depuis le {formatDate(file.createdAt)}
              </span>
              <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: conn.bg, color: conn.fg }}>
                {conn.label}
              </span>
              {file.isTest ? (
                <span className="rounded-full bg-[#3A1818] px-3 py-1 text-xs font-semibold text-[#FF8E8E]">
                  Compte test
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`mailto:${encodeURIComponent(file.email)}`}
            className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#151C33]"
          >
            Écrire
          </a>
          <button
            type="button"
            disabled={passwordInviteBusy}
            onClick={() => void sendPasswordInvite()}
            className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#151C33] disabled:opacity-50"
          >
            {passwordInviteBusy ? "Envoi…" : "Demander à créer un mot de passe"}
          </button>
          <button
            type="button"
            className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#151C33]"
            title="Ouvre l’espace apprenant de ce client en lecture (votre session Control ne change pas)"
            onClick={() => {
              void (async () => {
                try {
                  const res = await fetch("/api/super/learner-preview", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: file.id }),
                  });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(json.error || "Ouverture impossible");
                  window.location.href = String(json.href || "/dashboard/apprenant");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Ouverture impossible");
                }
              })();
            }}
          >
            Ouvrir son espace
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7B6CFF]"
          >
            Modifier
          </button>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-[#1A2340] pb-3">
        {[
          { id: "coordonnees", label: "Coordonnées" },
          { id: "formations", label: `Formations (${file.formations.length})` },
          {
            id: "coffre",
            label: coffreTotal ? `Coffre Qualiopi (${coffreReady}/${coffreTotal})` : "Coffre Qualiopi",
          },
          { id: "suivi", label: `Suivi (${file.progressAvgPct}%)` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => scrollToId(tab.id)}
            className="rounded-full border border-[#26304F] px-3 py-1.5 text-xs font-semibold text-[#C9D2E8] hover:border-[#6E5BFF] hover:text-white"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {missingLabels.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-[#5A4A1E] bg-[#2A2410] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#F2CF6B]">
            {missingLabels.length} pièce{missingLabels.length > 1 ? "s" : ""} Qualiopi en attente —{" "}
            {missingLabels.join(", ")}
          </p>
          <button
            type="button"
            onClick={() => void relance()}
            className="shrink-0 rounded-full bg-[#F2CF6B] px-4 py-2 text-sm font-semibold text-[#1A1408]"
          >
            Relancer {file.firstName || "le client"}
          </button>
        </div>
      ) : null}

      <section id="coordonnees" className={`${CARD} scroll-mt-28 p-5 sm:p-6`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-white">Coordonnées</h2>
          {!editing ? (
            <button type="button" onClick={() => setEditing(true)} className="text-sm font-semibold text-[#A99BFF]">
              Modifier
            </button>
          ) : null}
        </div>
        {addressMissing ? (
          <p className="mt-3 rounded-xl border border-[#5A4A1E] bg-[#2A2410] px-3 py-2 text-xs text-[#F2CF6B]">
            Adresse nécessaire pour le contrat
          </p>
        ) : null}

        {editing ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9AA3BD]">
              Prénom
              <input className={INPUT} value={draft.firstName} onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))} />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9AA3BD]">
              Nom
              <input className={INPUT} value={draft.lastName} onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))} />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9AA3BD]">
              Email
              <input className={INPUT} type="email" value={draft.email} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9AA3BD]">
              Téléphone
              <input className={INPUT} value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} />
            </label>
            <label className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-[#9AA3BD]">
              Adresse
              <input className={INPUT} value={draft.addressLine} onChange={(e) => setDraft((d) => ({ ...d, addressLine: e.target.value }))} />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9AA3BD]">
              Code postal
              <input className={INPUT} value={draft.postalCode} onChange={(e) => setDraft((d) => ({ ...d, postalCode: e.target.value }))} />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-[#9AA3BD]">
              Ville
              <input className={INPUT} value={draft.city} onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))} />
            </label>
            <label className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-[#9AA3BD]">
              Financement
              <select
                className={INPUT}
                value={draft.fundingType}
                onChange={(e) => setDraft((d) => ({ ...d, fundingType: e.target.value as "" | BtocFundingType }))}
              >
                <option value="">—</option>
                <option value="fonds_propres">Fonds propres</option>
                <option value="cpf">CPF</option>
                <option value="autre">Autre</option>
              </select>
            </label>
            <div className="sm:col-span-2 flex gap-2 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveCoords()}
                className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold text-[#C9D2E8]"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Prénom", file.firstName],
              ["Nom", file.lastName],
              ["Email", file.email],
              ["Téléphone", file.phone],
              [
                "Adresse",
                [file.addressLine, [file.postalCode, file.city].filter(Boolean).join(" ")].filter(Boolean).join(", ") ||
                  null,
              ],
              ["Financement", file.fundingType ? FUNDING_LABEL[file.fundingType] : null],
              ...(file.canViewAdaptation
                ? [["Besoin d’adaptation", file.adaptationNeedDeclared ? "Déclaré — voir Espace handicap" : "Aucun déclaré"] as const]
                : []),
            ].map(([label, value]) => (
              <div key={label as string}>
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${MUTED}`}>{label}</p>
                <p className="mt-1 text-sm font-medium text-white">{(value as string | null)?.trim() || "—"}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="formations" className={`${CARD} scroll-mt-28 p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-white">Formations</h2>
          <button
            type="button"
            onClick={() => void openAssign()}
            className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white"
          >
            + Assigner une formation
          </button>
        </div>

        {file.formations.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-[#26304F] px-6 py-10 text-center">
            <p className="text-sm font-semibold text-white">Aucune formation</p>
            <p className={`mt-1 text-sm ${MUTED}`}>Assignez une formation du catalogue pour ouvrir le coffre Qualiopi.</p>
            <button
              type="button"
              onClick={() => void openAssign()}
              className="mt-4 rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white"
            >
              Assigner une formation
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {file.formations.map((f) => (
              <article key={f.id} className="overflow-hidden rounded-2xl border border-[#1A2340] bg-[#0B1122]">
                <div className="grid gap-0 lg:grid-cols-[140px_1fr]">
                  <div
                    className="min-h-[100px] bg-gradient-to-br from-[#6E5BFF] to-[#2F7CF6]"
                    style={f.coverUrl ? { backgroundImage: `url(${f.coverUrl})`, backgroundSize: "cover" } : undefined}
                  />
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          f.status === "terminee"
                            ? "bg-[#163228] text-[#6BE39B]"
                            : f.status === "en_cours"
                              ? "bg-[#1A2A4A] text-[#8DB8FF]"
                              : "bg-[#1A2340] text-[#9AA3BD]"
                        }`}
                      >
                        {f.status === "terminee" ? "Terminée" : f.status === "en_cours" ? "En cours" : "Non commencée"}
                      </span>
                      <span className="rounded-full bg-[#1A2340] px-2.5 py-0.5 text-[11px] font-semibold text-[#C9D2E8]">
                        {f.origin === "achat" ? "Achat en ligne" : "Assignée"}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-white">{f.title}</h3>
                    <p className={`mt-1 text-xs ${MUTED}`}>
                      {f.purchasedAt ? formatDate(f.purchasedAt) : "—"}
                      {f.priceTtc != null ? ` · ${Number(f.priceTtc).toLocaleString("fr-FR")} € TTC` : ""}
                      {f.paymentMethod ? ` · ${f.paymentMethod}` : ""}
                      {f.accessEndsAt ? ` · Accès jusqu’au ${formatDate(f.accessEndsAt)}` : ""}
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1A2340]">
                      <div className="h-full rounded-full bg-[#6BE39B]" style={{ width: `${f.progressPct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-[#6BE39B]">{f.progressPct} %</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <input
        ref={uploadInputRef}
        type="file"
        accept="application/pdf,.pdf,image/jpeg,image/png,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => void onUploadFile(e.target.files)}
      />

      <section id="coffre" className={`${CARD} scroll-mt-28 p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-white">
            Coffre Qualiopi{" "}
            <span className={`text-sm font-semibold ${MUTED}`}>
              {coffreTotal ? `${coffreReady} / ${coffreTotal}` : ""}
            </span>
          </h2>
          {activeCoffre ? (
            <a
              href={`/api/super-admin/crm/formation-dossiers/${activeCoffre.dossier_id}/coffre?format=zip`}
              className="rounded-full border border-[#26304F] px-3 py-1.5 text-xs font-semibold text-[#C9D2E8] hover:text-white"
            >
              Tout télécharger (ZIP)
            </a>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
          {(
            [
              ["missing", "Absent"],
              ["partial", "Incomplet"],
              ["ready", "Déposé"],
            ] as const
          ).map(([key, label]) => (
            <span
              key={key}
              className="rounded-full px-2.5 py-0.5"
              style={{ background: COFFRE_STATUS[key].bg, color: COFFRE_STATUS[key].fg }}
            >
              {label}
            </span>
          ))}
        </div>

        {file.coffres.length === 0 ? (
          <p className={`mt-4 text-sm ${MUTED}`}>
            Aucun coffre encore — l’assignation d’une formation génère le contrat et ouvre le coffre.
          </p>
        ) : (
          <>
            {file.coffres.length > 1 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {file.coffres.map((c, i) => (
                  <button
                    key={c.dossier_id}
                    type="button"
                    onClick={() => setSelectedCoffre(i)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      i === selectedCoffre ? "bg-[#6E5BFF] text-white" : "bg-[#1A2340] text-[#C9D2E8]"
                    }`}
                  >
                    {c.formationTitle}
                  </button>
                ))}
              </div>
            ) : null}
            {activeCoffre ? (
              <ul className="mt-4 space-y-2">
                {activeCoffre.items.map((item) => {
                  const tone = COFFRE_STATUS[item.status] ?? COFFRE_STATUS.not_due;
                  const docId = item.document_ids?.[0];
                  const href = docId
                    ? `/api/super-admin/crm/formation-documents/${docId}/pdf`
                    : item.kind && activeCoffre.dossier_id
                      ? `/api/super-admin/crm/formation-dossiers/${activeCoffre.dossier_id}/documents/${item.kind}/pdf`
                      : null;
                  // Upload possible même si « pas dû » (dépôt manuel staff).
                  const canUpload = Boolean(item.kind);
                  const canSend =
                    Boolean(item.kind) &&
                    item.status !== "not_due" &&
                    isLot4Kind(String(item.kind));
                  const busyUpload = coffreBusyKey === `upload:${item.key}`;
                  const busySend = coffreBusyKey === `send:${item.key}`;
                  return (
                    <li
                      key={item.key}
                      className="rounded-xl border border-[#1A2340] bg-[#0B1122] px-3 py-2.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white">{item.label}</p>
                          {item.detail ? <p className={`text-xs ${MUTED}`}>{item.detail}</p> : null}
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{ background: tone.bg, color: tone.fg }}
                        >
                          {tone.label}
                        </span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {item.actionHref ? (
                          <a
                            href={item.actionHref}
                            className="rounded-full bg-[#6E5BFF] px-3 py-1 text-[11px] font-semibold text-white"
                          >
                            {item.actionLabel || "Ouvrir"}
                          </a>
                        ) : null}
                        {href ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#26304F] px-3 py-1 text-[11px] font-semibold text-[#C9D2E8] hover:text-white"
                          >
                            Ouvrir
                          </a>
                        ) : null}
                        {canUpload && item.kind ? (
                          <button
                            type="button"
                            disabled={Boolean(coffreBusyKey)}
                            onClick={() =>
                              pickUpload(activeCoffre.dossier_id, item.kind!, item.key)
                            }
                            className="rounded-full border border-[#26304F] px-3 py-1 text-[11px] font-semibold text-[#C9D2E8] hover:text-white disabled:opacity-50"
                          >
                            {busyUpload ? "Upload…" : "Uploader"}
                          </button>
                        ) : null}
                        {canSend && item.kind ? (
                          <button
                            type="button"
                            disabled={Boolean(coffreBusyKey)}
                            onClick={() =>
                              void sendCoffreDoc(activeCoffre.dossier_id, item.kind!, item.key)
                            }
                            className="rounded-full bg-[#6E5BFF] px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
                          >
                            {busySend ? "Envoi…" : "Envoyer en ligne"}
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </>
        )}
      </section>

      {file.formations.length > 0 ? (
        <section id="suivi" className={`${CARD} scroll-mt-28 p-5 sm:p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold text-white">Suivi</h2>
            <a
              href={`/super/lms/suivi/${file.id}`}
              className="rounded-full border border-[#26304F] px-3 py-1.5 text-xs font-semibold text-[#C9D2E8] hover:text-white"
            >
              Exporter le relevé
            </a>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Progression", value: `${file.progressAvgPct} %` },
              { label: "Formations", value: String(file.formations.length) },
              {
                label: "En cours",
                value: String(file.formations.filter((f) => f.status === "en_cours").length),
              },
              {
                label: "Terminées",
                value: String(file.formations.filter((f) => f.status === "terminee").length),
              },
              { label: "Coffre", value: coffreTotal ? `${coffreReady}/${coffreTotal}` : "—" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-2xl border border-[#1A2340] bg-[#0B1122] px-3 py-4 text-center">
                <p className="text-2xl font-extrabold text-white">{kpi.value}</p>
                <p className={`mt-1 text-[11px] font-semibold uppercase tracking-wide ${MUTED}`}>{kpi.label}</p>
              </div>
            ))}
          </div>
          <p className={`mt-4 text-sm ${MUTED}`}>
            Détail modules / quiz / flashcards : fiche de suivi LMS apprenant (composant existant).
          </p>
        </section>
      ) : null}

      {assignOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className={`${CARD} relative z-10 w-full max-w-lg p-6`}>
            <h3 className="text-lg font-extrabold text-white">Assigner une formation</h3>
            <p className={`mt-1 text-sm ${MUTED}`}>
              Crée l’inscription, ouvre le coffre Qualiopi et envoie le test de positionnement.
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[#9AA3BD]">
              Formation
              <select className={INPUT} value={assignCourseId} onChange={(e) => setAssignCourseId(e.target.value)}>
                <option value="">Choisir…</option>
                {catalog.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-[#9AA3BD]">
              Motif
              <select className={INPUT} value={assignReason} onChange={(e) => setAssignReason(e.target.value)}>
                <option value="offerte">Offerte</option>
                <option value="geste_commercial">Geste commercial</option>
                <option value="payee_hors_site">Payée hors site</option>
              </select>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssignOpen(false)}
                className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold text-[#C9D2E8]"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={assignBusy}
                onClick={() => void submitAssign()}
                className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {assignBusy ? "…" : "Assigner"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
