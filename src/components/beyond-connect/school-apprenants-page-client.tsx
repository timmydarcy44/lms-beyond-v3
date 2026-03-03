"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SchoolApprenantsTable } from "@/components/beyond-connect/school-apprenants-table";
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

type SchoolApprenantsPageClientProps = {
  studentsRows: ProfileRow[];
  offers: OfferRow[];
  schoolId: string | null;
};

export function SchoolApprenantsPageClient({
  studentsRows,
  offers,
  schoolId,
}: SchoolApprenantsPageClientProps) {
  const supabase = createSupabaseBrowserClient();
  const [localRows, setLocalRows] = useState<ProfileRow[]>(studentsRows);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [linkToken, setLinkToken] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [className, setClassName] = useState("Bachelor RH");
  const [contractType, setContractType] = useState("Alternance");
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

  const sendInvitation = async (emailAddress: string) => {
    if (!emailAddress) return;
    // Mock invitation for now.
    toast.success(`Invitation envoyée à ${emailAddress}`);
  };

  const getOpcoFromNaf = (naf: string): string => {
    if (!naf) return "À vérifier";
    const prefix2 = naf.substring(0, 2);

    if (["64", "65", "66", "69", "70", "71", "72", "73", "74", "75"].includes(prefix2)) return "ATLAS";
    if (["45", "49", "50", "51", "52", "53"].includes(prefix2)) return "OPCO Mobilités";
    if (["10", "11", "13", "14", "15", "16", "17", "18"].includes(prefix2)) return "OCAPIAT";
    if (["01", "02", "03", "05", "06", "07", "08", "09"].includes(prefix2)) return "OPCO 2i";
    if (["41", "42", "43"].includes(prefix2)) return "Constructys";
    if (["46", "47", "77", "79", "81", "82"].includes(prefix2)) return "L'Opcommerce";
    if (["55", "56", "58", "59", "60", "61", "62", "63"].includes(prefix2)) return "OPCO Santé";
    if (["84", "85", "86", "87", "88", "94"].includes(prefix2)) return "AKTO";
    if (["90", "91", "92", "93"].includes(prefix2)) return "AFDAS";
    if (["95", "96"].includes(prefix2)) return "OPCO Uniformation";

    return `À vérifier (NAF: ${naf})`;
  };

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
    setClassName("Bachelor RH");
    setContractType("Alternance");
    setFormError(null);
    setCompanyLinkEnabled(false);
    setSelectedCompanyId("");
    setCompanySiret("");
    setCompanyScanError("");
    setCompanyQuery("");
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
    if (!schoolId || isSubmitting || !supabase) return;
    const token = linkToken.trim();
    const normalizedToken = token.toUpperCase().startsWith("APP-")
      ? token.slice(4).trim()
      : token;
    if (!token && (!firstName.trim() || !lastName.trim() || !email.trim())) {
      setFormError("Merci de renseigner Nom, Prenom et Email.");
      return;
    }
    setIsSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      setIsSubmitting(false);
      return;
    }
    const payloadBase = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      school_class: className,
      contract_type: contractType,
      role_type: "apprenant",
      school_id: schoolId,
      ...(selectedCompanyId && selectedCompanyId !== "not_listed"
        ? { company_id: selectedCompanyId }
        : {}),
    };
    console.log("Payload complet envoyé :", payloadBase);
    let profileId: string | undefined;
    let profileData: ProfileRow | null = null;

    if (token) {
      const tokenLower = normalizedToken.toLowerCase();
      const isEmailToken = tokenLower.includes("@");
      let existingByToken: Record<string, unknown> | null = null;
      if (isEmailToken) {
        const { data, error: tokenError } = await supabase
          .from("profiles")
          .select("*")
          .ilike("email", normalizedToken)
          .maybeSingle();
        if (tokenError) {
          setFormError(tokenError.message);
          setIsSubmitting(false);
          return;
        }
        existingByToken = data as Record<string, unknown> | null;
      } else {
        const { data: exact, error: exactError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", normalizedToken)
          .maybeSingle();
        if (exactError) {
          setFormError(exactError.message);
          setIsSubmitting(false);
          return;
        }
        if (exact) {
          existingByToken = exact as Record<string, unknown>;
        } else {
          const { data: partial, error: partialError } = await supabase
            .from("profiles")
            .select("*")
            .ilike("id", `${normalizedToken}%`)
            .limit(2);
          if (partialError) {
            setFormError(partialError.message);
            setIsSubmitting(false);
            return;
          }
          if ((partial ?? []).length > 1) {
            setFormError("Plusieurs apprenants correspondent à cet identifiant. Ajoutez plus de caractères.");
            setIsSubmitting(false);
            return;
          }
          existingByToken = (partial ?? [])[0] as Record<string, unknown> | undefined ?? null;
        }
      }
      if (!existingByToken) {
        setFormError("Aucun apprenant trouvé avec cet email ou identifiant.");
        setIsSubmitting(false);
        return;
      }
      profileId = String((existingByToken as { id?: string }).id ?? "");
      const patch = {
        school_id: schoolId,
        role_type: "apprenant",
        ...(className.trim() ? { school_class: className.trim() } : {}),
        ...(contractType.trim() ? { contract_type: contractType.trim() } : {}),
      };
      const { data: updatedData, error: updateError } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", profileId)
        .select("*")
        .single();
      if (updateError) {
        setFormError(updateError.message);
        setIsSubmitting(false);
        return;
      }
      profileData = updatedData as ProfileRow;
    } else {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", payloadBase.email)
        .maybeSingle();

      profileId = existing?.id;
      if (existing?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .update(payloadBase)
          .eq("id", existing.id)
          .select("*")
          .single();
        if (error) {
          setFormError(error.message);
          setIsSubmitting(false);
          return;
        }
        profileData = data as ProfileRow;
      } else {
        const newId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const payloadInsert = { id: newId, ...payloadBase };
        const { data, error } = await supabase.from("profiles").insert(payloadInsert).select("*").single();
        if (error) {
          setFormError(error.message);
          setIsSubmitting(false);
          return;
        }
        profileId = newId;
        profileData = data as ProfileRow;
      }
    }

    if (profileId) {
      const { error: enrollmentError } = await supabase.from("school_students").insert({
        school_id: schoolId,
        student_id: profileId,
      });
      if (enrollmentError && enrollmentError.code !== "23505") {
        setFormError(enrollmentError.message);
        setIsSubmitting(false);
        return;
      }
    }

    if (profileData) {
      setLocalRows((prev) => {
        const next = prev.filter((row) => row.id !== profileData?.id);
        return [profileData as ProfileRow, ...next];
      });
    }
    if (!token) {
      await sendInvitation(email);
    } else {
      toast.success("Apprenant rattaché à l'école avec succès.");
    }
    setDialogOpen(false);
    resetForm();
    setIsSubmitting(false);
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
          </div>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
          >
            + Ajouter un apprenant
          </button>
        </div>
      </header>

      <SchoolApprenantsTable studentsRows={localRows} offers={offers} />

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
                Si ce champ est rempli, on rattache directement le compte existant à l'école.
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
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#1C1C1E] px-3 py-2 text-white"
              >
                <option>Bachelor RH</option>
                <option>Bachelor Commerce</option>
                <option>Mastère Business</option>
                <option>Mastère RH</option>
              </select>
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
              </select>
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
    </div>
  );
}
