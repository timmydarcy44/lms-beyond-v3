"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SchoolApprenantsTable } from "@/components/beyond-connect/school-apprenants-table";
import { getOpcoFromNaf } from "@/lib/ecole/siret-company-helpers";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone?: string | null;
  school_class?: string | null;
  class_name?: string | null;
  class?: string | null;
  promo?: string | null;
  contract_type?: string | null;
  soft_skills_scores?: Record<string, number> | null;
  disc_profile?: string | null;
  disc_scores?: { D: number; I: number; S: number; C: number } | null;
  open_badges?: string[] | null;
  tutor_feedback?: string | null;
  live_status?: "live" | "en_poste" | "test" | null;
  avatar_url?: string | null;
  handicap_alert?: { label: string } | null;
};

type OfferRow = {
  id: string;
  title?: string | null;
  target_disc?: { D: number; I: number; S: number; C: number };
};

type SchoolClassOption = { id: string; name: string | null };

type SchoolApprenantsPageClientProps = {
  studentsRows: ProfileRow[];
  offers: OfferRow[];
  schoolId: string | null;
  classOptions?: SchoolClassOption[];
  initialAddOpen?: boolean;
  initialClassId?: string;
};

type BulkRow = {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  school_class: string;
  contract_type: string;
};

function splitCsvLine(line: string, sep: string): string[] {
  return line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
}

/** CSV ou tableau ; séparateur `,` ou `;`. Ligne d'en-tête optionnelle. */
function parseApprenantBulkPaste(raw: string): BulkRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (!lines.length) return [];

  const sep =
    lines[0].includes(";") && (!lines[0].includes(",") || lines[0].split(";").length >= lines[0].split(",").length)
      ? ";"
      : ",";

  const headerCells = splitCsvLine(lines[0], sep).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const looksLikeHeader = headerCells.some((h) => h === "email" || h === "mail" || h === "e-mail");

  const pickIdx = (names: string[], cells: string[]) => {
    for (let i = 0; i < cells.length; i++) {
      const n = cells[i].toLowerCase().replace(/\s+/g, "_");
      if (names.includes(n)) return i;
    }
    return -1;
  };

  let headerRow = headerCells;
  let bodyLines = lines;
  if (!looksLikeHeader) {
    headerRow = ["email", "first_name", "last_name", "phone", "school_class", "contract_type"];
    bodyLines = lines;
  } else {
    bodyLines = lines.slice(1);
  }

  const idxEmail = pickIdx(["email", "mail", "e-mail", "courriel"], headerRow);
  const idxFirst = pickIdx(["first_name", "prenom", "prénom", "firstname"], headerRow);
  const idxLast = pickIdx(["last_name", "nom", "lastname", "name"], headerRow);
  const idxPhone = pickIdx(["phone", "telephone", "téléphone", "tel", "mobile"], headerRow);
  const idxClass = pickIdx(["school_class", "classe", "class", "promo"], headerRow);
  const idxContract = pickIdx(["contract_type", "contrat", "type_contrat"], headerRow);

  const rows: BulkRow[] = [];
  for (const line of bodyLines) {
    const cells = splitCsvLine(line, sep);
    const email =
      (idxEmail >= 0 ? cells[idxEmail] : cells[0])?.trim().toLowerCase() ?? "";
    if (!email || !email.includes("@")) continue;
    rows.push({
      email,
      first_name: (idxFirst >= 0 ? cells[idxFirst] : cells[1])?.trim() ?? "",
      last_name: (idxLast >= 0 ? cells[idxLast] : cells[2])?.trim() ?? "",
      phone: (idxPhone >= 0 ? cells[idxPhone] : cells[3])?.trim() ?? "",
      school_class: (idxClass >= 0 ? cells[idxClass] : cells[4])?.trim() ?? "",
      contract_type: (idxContract >= 0 ? cells[idxContract] : cells[5])?.trim() ?? "",
    });
  }
  return rows;
}

export function SchoolApprenantsPageClient({
  studentsRows,
  offers,
  schoolId,
  classOptions = [],
  initialAddOpen = false,
  initialClassId = "",
}: SchoolApprenantsPageClientProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [localRows, setLocalRows] = useState<ProfileRow[]>(studentsRows);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkPassword, setBulkPassword] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [linkToken, setLinkToken] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedClassId, setSelectedClassId] = useState(() => classOptions[0]?.id ?? "");
  const [contractType, setContractType] = useState("Alternance");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [avatarHttps, setAvatarHttps] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [companyLinkEnabled, setCompanyLinkEnabled] = useState(false);
  const [companyOptions, setCompanyOptions] = useState<
    Array<{ id: string; company_name?: string | null; name?: string | null; siret?: string | null }>
  >([]);
  const [companyQuery, setCompanyQuery] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [companySiret, setCompanySiret] = useState("");
  const [companyScanError, setCompanyScanError] = useState("");
  const [companyScanLoading, setCompanyScanLoading] = useState(false);
  const [studentJoinCode, setStudentJoinCode] = useState<string | null>(null);
  const [joinCodeLoading, setJoinCodeLoading] = useState(false);
  const [joinCodeRegenerating, setJoinCodeRegenerating] = useState(false);

  const resolvedSchoolClassName = useMemo(() => {
    const c = classOptions.find((x) => x.id === selectedClassId);
    return (c?.name ?? "").trim();
  }, [classOptions, selectedClassId]);

  const sendInvitation = async (emailAddress: string) => {
    if (!emailAddress) return;
    // Mock invitation for now.
    toast.success(`Invitation envoyée à ${emailAddress}`);
  };

  useEffect(() => {
    setLocalRows(studentsRows);
  }, [studentsRows]);

  useEffect(() => {
    if (!classOptions.length) {
      setSelectedClassId("");
      return;
    }
    setSelectedClassId((prev) => (prev && classOptions.some((c) => c.id === prev) ? prev : classOptions[0].id));
  }, [classOptions]);

  useEffect(() => {
    if (!initialAddOpen) return;
    setDialogOpen(true);
  }, [initialAddOpen]);

  useEffect(() => {
    if (!initialClassId || !classOptions.some((c) => c.id === initialClassId)) return;
    setSelectedClassId(initialClassId);
  }, [initialClassId, classOptions]);

  useEffect(() => {
    if (!schoolId) {
      setStudentJoinCode(null);
      return;
    }
    let cancelled = false;
    setJoinCodeLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/dashboard/ecole/join-code");
        const json = (await res.json().catch(() => null)) as { code?: string; error?: string } | null;
        if (cancelled) return;
        if (res.ok && json?.code) {
          setStudentJoinCode(String(json.code));
        } else if (json?.error === "SERVICE_NOT_CONFIGURED" || json?.error === "MIGRATION_REQUIRED") {
          setStudentJoinCode(null);
        } else if (!res.ok) {
          setStudentJoinCode(null);
        }
      } finally {
        if (!cancelled) setJoinCodeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  useEffect(() => {
    const loadCompanies = async () => {
      if (!dialogOpen || !schoolId || !supabase) return;
      const { data, error } = await supabase
        .from("crm_prospects")
        .select("id, company_name, name, siret, company_status, step")
        .eq("school_id", schoolId);
      if (!error && data) {
        const filtered = data.filter((row: any) =>
          ["client", "prospect"].includes(String(row.company_status || "").toLowerCase())
        );
        setCompanyOptions(filtered.length ? filtered : data);
      }
    };
    loadCompanies();
  }, [dialogOpen, schoolId, supabase]);

  const resetForm = () => {
    setLinkToken("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setSelectedClassId(classOptions[0]?.id ?? "");
    setContractType("Alternance");
    setAvatarDataUrl(null);
    setAvatarHttps("");
    if (avatarFileRef.current) avatarFileRef.current.value = "";
    setFormError(null);
    setCompanyLinkEnabled(false);
    setSelectedCompanyId("");
    setCompanySiret("");
    setCompanyScanError("");
    setCompanyQuery("");
  };

  const avatarForApi = (): string | undefined => {
    const u = avatarHttps.trim();
    if (u.startsWith("https://") || u.startsWith("http://")) return u;
    if (avatarDataUrl) return avatarDataUrl;
    return undefined;
  };

  const handleScanCompany = async () => {
    if (!companySiret || companySiret.length !== 14 || !schoolId || !supabase) {
      setCompanyScanError("SIRET invalide");
      return;
    }
    setCompanyScanLoading(true);
    setCompanyScanError("");
    try {
      const [gouvResponse, proxyResponse] = await Promise.all([
        fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${companySiret}`),
        fetch(`/api/proxy-opco?siret=${companySiret}`),
      ]);
      const gouvData = await gouvResponse.json();
      const proxyData = await proxyResponse.json().catch(() => ({}));
      const first = gouvData?.results?.[0];
      const siege = first?.siege || {};
      const rawName =
        proxyData?.raison_sociale ||
        first?.nom_raison_sociale ||
        first?.nom_entreprise ||
        first?.denomination;
      if (!rawName) {
        setCompanyScanError("Nom d'entreprise introuvable");
        return;
      }
      const nafCode = proxyData?.activite_principale || first?.activite_principale || "";
      let opcoName = proxyData?.opco_name || "";
      if (!opcoName || opcoName === "À déterminer") {
        opcoName = getOpcoFromNaf(nafCode);
      }
      const nextCity = siege?.libelle_commune || "";
      const nextZip = siege?.code_postal || "";
      const address = [proxyData?.adresse || siege?.adresse || "", nextZip, nextCity]
        .filter(Boolean)
        .join(" ")
        .trim();
      const { data, error } = await supabase
        .from("crm_prospects")
        .upsert(
          {
            name: rawName,
            company_name: rawName,
            siret: companySiret,
            naf_code: nafCode,
            opco_name: opcoName,
            city: nextCity || null,
            zip_code: nextZip || null,
            address: address || null,
            step: "Prospect",
            company_status: "prospect",
            school_id: schoolId,
          },
          { onConflict: "siret" }
        )
        .select("id, company_name, name, siret")
        .single();
      if (error || !data) {
        setCompanyScanError(error?.message || "Impossible de créer l'entreprise");
        return;
      }
      setSelectedCompanyId(data.id);
      setCompanyOptions((prev) => {
        if (prev.some((row) => row.id === data.id)) return prev;
        return [data, ...prev];
      });
    } finally {
      setCompanyScanLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!schoolId || isSubmitting) return;
    const token = linkToken.trim();
    if (!token && (!firstName.trim() || !lastName.trim() || !email.trim())) {
      setFormError("Merci de renseigner Nom, Prenom et Email.");
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    const avatar_url = avatarForApi();
    try {
      const res = await fetch("/api/dashboard/ecole/apprenants/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          token
            ? {
                action: "link_by_token",
                token,
                school_class: resolvedSchoolClassName,
                contract_type: contractType,
                company_id: selectedCompanyId || undefined,
                class_id: selectedClassId && /^[0-9a-f-]{36}$/i.test(selectedClassId) ? selectedClassId : undefined,
                ...(avatar_url ? { avatar_url } : {}),
              }
            : {
                action: "create_or_update",
                first_name: firstName,
                last_name: lastName,
                email,
                phone,
                school_class: resolvedSchoolClassName,
                contract_type: contractType,
                company_id: selectedCompanyId || undefined,
                class_id: selectedClassId && /^[0-9a-f-]{36}$/i.test(selectedClassId) ? selectedClassId : undefined,
                ...(avatar_url ? { avatar_url } : {}),
              },
        ),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        details?: string;
        profile?: ProfileRow;
      } | null;
      if (!res.ok || !json?.ok) {
        let msg =
          json?.details ||
          json?.error ||
          (res.status === 404
            ? "Aucun apprenant trouvé avec cet email ou identifiant."
            : res.status === 409
              ? "Plusieurs profils correspondent : utilisez l'UUID complet ou l'email."
              : res.status === 503
                ? "Migration serveur manquante (recherche par fragment d'ID). Contactez l'administrateur."
                : "Impossible d'enregistrer l'apprenant.");
        if (/rate\s*limit|email rate limit/i.test(String(msg))) {
          msg =
            "Limite d’envoi d’e-mails (invitation Supabase) atteinte : attendez quelques minutes avant une nouvelle création, ou contactez l’administrateur pour le quota.";
        }
        setFormError(msg);
        setIsSubmitting(false);
        return;
      }
      const profileData = json.profile as ProfileRow | undefined;
      if (profileData) {
        setLocalRows((prev) => {
          const next = prev.filter((row) => row.id !== profileData.id);
          return [profileData, ...next];
        });
      }
      if (!token) {
        await sendInvitation(email);
      } else {
        toast.success("Apprenant rattaché à l'école avec succès.");
      }
      router.refresh();
      setDialogOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkImport = async () => {
    if (!schoolId || bulkSubmitting) return;
    const rows = parseApprenantBulkPaste(bulkText);
    if (!rows.length) {
      toast.error("Aucune ligne valide", { description: "Ajoutez au moins une adresse email par ligne." });
      return;
    }
    setBulkSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/ecole/apprenants/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          tempPassword: bulkPassword.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        successCount?: number;
        processed?: number;
        results?: Array<{ ok: boolean; email: string; error?: string }>;
      } | null;
      if (!res.ok) {
        toast.error("Import impossible", { description: String((json as any)?.error ?? res.status) });
        return;
      }
      const ok = json?.successCount ?? 0;
      const total = json?.processed ?? rows.length;
      toast.success(`Import terminé : ${ok} / ${total}`, {
        description:
          ok < total
            ? "Consultez la console réseau pour le détail des lignes en erreur."
            : "Les comptes sont créés ou invités et rattachés à votre organisme.",
      });
      setBulkText("");
      setBulkPassword("");
      setBulkOpen(false);
      router.refresh();
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-white/10 bg-white/70 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Mes Apprenants</h1>
            <p className="mt-2 text-sm text-black/60">
              Liste exhaustive des profils et envoi d'offres en un clic.
            </p>
            {schoolId ? (
              <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950">
                <div className="font-semibold text-emerald-900">Code apprenants (rattachement auto)</div>
                <p className="mt-1 text-xs text-emerald-900/80">
                  Les jeunes ouvrent leur tableau de bord apprenant et saisissent ce code : pas besoin de copier leur
                  identifiant technique.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {joinCodeLoading ? (
                    <span className="font-mono text-sm text-emerald-900/60">Chargement du code…</span>
                  ) : studentJoinCode ? (
                    <code className="rounded-lg bg-white/80 px-3 py-1.5 font-mono text-base font-semibold tracking-wide text-emerald-950 ring-1 ring-emerald-500/20">
                      {studentJoinCode}
                    </code>
                  ) : (
                    <span className="text-xs text-emerald-900/70">
                      Code indisponible (vérifiez la migration BDD ou la clé service).
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={!studentJoinCode || joinCodeLoading}
                    onClick={() => {
                      if (!studentJoinCode) return;
                      void navigator.clipboard.writeText(studentJoinCode);
                      toast.success("Code copié");
                    }}
                    className="rounded-full border border-emerald-800/20 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-900 disabled:opacity-40"
                  >
                    Copier
                  </button>
                  <button
                    type="button"
                    disabled={joinCodeRegenerating || joinCodeLoading || !schoolId}
                    onClick={async () => {
                      setJoinCodeRegenerating(true);
                      try {
                        const res = await fetch("/api/dashboard/ecole/join-code", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "regenerate" }),
                        });
                        const json = (await res.json().catch(() => null)) as { code?: string; error?: string } | null;
                        if (!res.ok || !json?.code) {
                          toast.error("Impossible de régénérer", { description: json?.error ?? res.statusText });
                          return;
                        }
                        setStudentJoinCode(String(json.code));
                        toast.success("Nouveau code généré", { description: "Pensez à communiquer le nouveau code aux apprenants." });
                      } finally {
                        setJoinCodeRegenerating(false);
                      }
                    }}
                    className="rounded-full border border-emerald-800/20 bg-emerald-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    {joinCodeRegenerating ? "…" : "Régénérer"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="rounded-full border border-black/15 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black"
            >
              Importer un CSV
            </button>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              + Ajouter un apprenant
            </button>
          </div>
        </div>
      </header>

      <SchoolApprenantsTable studentsRows={localRows} offers={offers} classOptions={classOptions} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[28px] bg-[#1C1C1E] text-white border border-white/10 backdrop-blur-md">
          <DialogTitle className="sr-only">Ajouter un apprenant</DialogTitle>
          <DialogDescription className="sr-only">
            Formulaire de création d'apprenant
          </DialogDescription>
          <DialogHeader>
            <DialogTitle>Ajouter un apprenant</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-white/70">Rattacher un apprenant existant</label>
              <input
                value={linkToken}
                onChange={(event) => setLinkToken(event.target.value)}
                placeholder="Email ou identifiant apprenant (APP-XXXXXXXX ou UUID)"
                className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              />
              <p className="text-[11px] text-white/45">
                Si ce champ est rempli, on rattache directement le compte existant à l&apos;école. Vous pouvez coller{" "}
                <strong>APP-…</strong> en entier, l&apos;<strong>UUID complet</strong>, ou un{" "}
                <strong>fragment</strong> (ex. FCDC770D) après déploiement de la migration serveur 20260503190000.
                Sinon, communiquez le <strong>code apprenants</strong> affiché en haut de la page : les jeunes le saisissent
                sur leur tableau de bord (sans identifiant technique).
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">Prenom</label>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">Nom</label>
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-white/70">Email</label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">Telephone</label>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">Classe</label>
              <select
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
                disabled={classOptions.length === 0}
                className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white disabled:opacity-50"
              >
                {classOptions.length === 0 ? (
                  <option value="">Aucune classe en base pour cette école</option>
                ) : (
                  classOptions.map((c) => {
                    const label = (c.name ?? "").trim() || "(Sans nom)";
                    return (
                      <option key={c.id} value={c.id}>
                        {label}
                      </option>
                    );
                  })
                )}
              </select>
              {classOptions.length === 0 ? (
                <p className="text-[11px] text-white/45">
                  Créez des entrées dans <strong>school_classes</strong> pour votre établissement : le menu se remplit automatiquement.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-white/70">Type de contrat</label>
              <select
                value={contractType}
                onChange={(event) => setContractType(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              >
                <option>Alternance</option>
                <option>Initial</option>
                <option>Stage</option>
                <option>Contrat FIP</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-white/70">Photo (optionnel)</label>
              <input
                ref={avatarFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const f = event.target.files?.[0];
                  if (!f) {
                    setAvatarDataUrl(null);
                    return;
                  }
                  if (f.size > 120_000) {
                    toast.error("Image trop lourde", { description: "120 Ko max pour l’aperçu embarqué." });
                    event.target.value = "";
                    setAvatarDataUrl(null);
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === "string") {
                      setAvatarDataUrl(reader.result);
                      setAvatarHttps("");
                    }
                  };
                  reader.readAsDataURL(f);
                }}
                className="w-full text-xs text-white/80 file:mr-2 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-white"
              />
              <input
                value={avatarHttps}
                onChange={(event) => {
                  setAvatarHttps(event.target.value);
                  if (event.target.value.trim()) setAvatarDataUrl(null);
                  if (avatarFileRef.current) avatarFileRef.current.value = "";
                }}
                placeholder="Ou URL https vers une image…"
                className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white placeholder:text-white/35"
              />
              {avatarDataUrl || /^https?:\/\//i.test(avatarHttps.trim()) ? (
                <div className="flex items-center gap-3 pt-1">
                  <img
                    src={avatarDataUrl || avatarHttps.trim()}
                    alt="Aperçu"
                    className="h-14 w-14 rounded-full border border-white/10 object-cover"
                  />
                  <span className="text-[11px] text-white/45">Enregistrée sur le profil à la validation.</span>
                </div>
              ) : null}
            </div>
            <div className="space-y-2 md:col-span-2">
              <button
                type="button"
                onClick={() =>
                  setCompanyLinkEnabled((prev) => {
                    const next = !prev;
                    if (!next) {
                      setSelectedCompanyId("");
                      setCompanySiret("");
                      setCompanyScanError("");
                    }
                    return next;
                  })
                }
                className="text-xs font-semibold text-white/70 underline"
              >
                Cet alternant a déjà une entreprise
              </button>
            </div>
            {companyLinkEnabled ? (
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-white/70">Entreprise associée</label>
                <input
                  value={companyQuery}
                  onChange={(event) => setCompanyQuery(event.target.value)}
                  placeholder="Rechercher une entreprise..."
                  className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                />
                <select
                  value={selectedCompanyId}
                  onChange={(event) => setSelectedCompanyId(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                >
                  <option value="">Sélectionner une entreprise</option>
                  {companyOptions
                    .filter((company) => {
                      if (!companyQuery.trim()) return true;
                      const label = `${company.company_name || ""} ${company.name || ""} ${
                        company.siret || ""
                      }`.toLowerCase();
                      return label.includes(companyQuery.toLowerCase());
                    })
                    .map((company) => {
                    const label =
                      company.company_name || company.name || company.siret || "Entreprise";
                    return (
                      <option key={company.id} value={company.id}>
                        {label}
                      </option>
                    );
                  })}
                  <option value="not_listed">L&apos;entreprise n&apos;est pas dans la liste</option>
                </select>
              </div>
            ) : null}
            {companyLinkEnabled && selectedCompanyId === "not_listed" ? (
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-white/70">Saisir un SIRET</label>
                <div className="flex items-center gap-2">
                  <input
                    value={companySiret}
                    onChange={(event) => setCompanySiret(event.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
                  />
                  <button
                    type="button"
                    onClick={handleScanCompany}
                    disabled={companyScanLoading}
                    className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                  >
                    {companyScanLoading ? "..." : "Scanner"}
                  </button>
                </div>
                {companyScanError ? <p className="text-xs text-red-300">{companyScanError}</p> : null}
              </div>
            ) : null}
          </div>
          {formError ? <p className="text-xs text-red-300">{formError}</p> : null}
          <DialogFooter>
            <button
              type="button"
              onClick={handleCreate}
              disabled={isSubmitting}
              className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              {isSubmitting ? "..." : "Enregistrer"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-3xl rounded-[28px] bg-[#1C1C1E] text-white border border-white/10 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle>Importer des apprenants (CSV)</DialogTitle>
            <DialogDescription className="text-white/60">
              Collez jusqu&apos;à 400 lignes. Séparateur virgule ou point-virgule. Optionnel : en-tête{" "}
              <span className="font-mono text-white/80">
                email, first_name, last_name, phone, school_class, contract_type
              </span>
              . Sans en-tête, la même colonne est attendue dans cet ordre. Mot de passe temporaire commun
              optionnel ; sinon invitation par email Supabase.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={14}
            placeholder={"jean@cfa.fr,Jean,Dupont,0612345678,Bachelor RH,Alternance\nmarie@cfa.fr,Marie,Martin,,,"}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs text-white placeholder:text-white/30"
          />
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/70">Mot de passe temporaire (optionnel)</label>
            <input
              type="password"
              value={bulkPassword}
              onChange={(e) => setBulkPassword(e.target.value)}
              placeholder="Laisser vide pour invitations email"
              className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setBulkOpen(false)}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/80"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleBulkImport}
              disabled={bulkSubmitting || !bulkText.trim()}
              className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white"
            >
              {bulkSubmitting ? "Import…" : "Lancer l'import"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
