"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Check } from "lucide-react";

type CompanyProfile = {
  id: string;
  name?: string | null;
  industry?: string | null;
  size?: string | null;
  description?: string | null;
  website?: string | null;
  logo_url?: string | null;
  slogan?: string | null;
  values?: string | null;
  company_type?: string | null;
  city?: string | null;
  bio?: string | null;
};

const companyTypes = ["Start-up", "PME", "ETI", "Grand Groupe", "TPE"];

export function CompanyProfile() {
  const supabase = useSupabase();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showSaveCheck, setShowSaveCheck] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [testCreating, setTestCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        if (!supabase) {
          setCompany({
            id: "",
            name: "",
            industry: "",
            size: "",
            description: "",
            website: "",
            logo_url: "",
            slogan: "",
            values: "",
            company_type: "",
            city: "",
          });
          setLogoPreview(null);
          return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user?.id) {
          setCompany({
            id: "",
            name: "",
            industry: "",
            size: "",
            description: "",
            website: "",
            logo_url: "",
            slogan: "",
            values: "",
            company_type: "",
            city: "",
          });
          setLogoPreview(null);
          return;
        }
        console.log("ID Utilisateur cherché:", userData.user.id);
        setUserId(userData.user.id);

        const { data: companyData, error } = await supabase
          .from("beyond_connect_companies")
          .select("*")
          .eq("id", userData.user.id)
          .maybeSingle();

        console.log("Data Entreprise récupérée:", companyData);

        if (error || !companyData) {
          if (!companyData) {
            console.log("L'entreprise n'existe pas en base pour cet ID");
          }
          setCompany({
            id: "",
            name: "",
            industry: "",
            size: "",
            description: "",
            website: "",
            logo_url: "",
            slogan: "",
            values: "",
            company_type: "",
            city: "",
          });
          setLogoPreview(null);
          return;
        }

        setCompany({
          ...companyData,
          name: companyData?.name || "",
          city: companyData?.city || "",
          website: companyData?.website || "",
          description: companyData?.description || "",
        });
        setLogoPreview(companyData?.logo_url || null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [supabase]);

  const updateField = (field: keyof CompanyProfile, value: string) => {
    setCompany((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const getFieldStyle = (isFocused: boolean) =>
    isFocused
      ? {
          backgroundImage:
            "linear-gradient(white, white), linear-gradient(to right, #3b82f6, #8b5cf6)",
          backgroundOrigin: "border-box",
          backgroundClip: "content-box, border-box",
          border: "2px solid transparent",
          boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.12)",
        }
      : { border: "1px solid #E5E7EB" };

  const handleLogoChange = async (file: File | null) => {
    if (!file) return;
    if (!supabase) {
      toast.error("Supabase n'est pas configuré.");
      return;
    }
    try {
      const filePath = `company-logos/${company?.id || "draft"}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("company-logos").upload(filePath, file, {
        upsert: true,
      });
      if (error) {
        toast.error("Erreur lors de l'upload du logo.");
        return;
      }
      const { data } = supabase.storage.from("company-logos").getPublicUrl(filePath);
      setLogoPreview(data.publicUrl);
      updateField("logo_url", data.publicUrl);
    } catch (err) {
      console.error("[company-profile] logo upload error:", err);
      toast.error("Erreur lors de l'upload du logo.");
    }
  };

  const onSave = async () => {
    if (!supabase) {
      toast.error("Supabase n'est pas configuré.");
      return;
    }
    setIsSaving(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        toast.error("Utilisateur non authentifié.");
        return;
      }

      const payload = {
        id: userData.user.id,
        name: company?.name || "",
        city: company?.city || "",
        website: company?.website || "",
        description: company?.description || "",
        industry: company?.industry || "",
        slogan: company?.slogan || "",
        bio: company?.description || "",
      };

      const { data, error } = await supabase
        .from("beyond_connect_companies")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();

      if (error) {
        toast.error(error.message || "Erreur lors de la sauvegarde.");
        return;
      }

      setCompany((prev) => ({ ...(prev || { id: "" }), ...data }));
      toast.success("Profil entreprise mis à jour.");
      setShowSaveCheck(true);
      setTimeout(() => setShowSaveCheck(false), 1400);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full text-black">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black">Entreprise</h1>
            <p className="mt-2 text-sm text-black/50">
              Renseignez les informations clés pour valoriser votre entreprise.
            </p>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="hidden items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] px-5 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-lg md:inline-flex"
          >
            {showSaveCheck ? <Check className="h-4 w-4 text-green-200" /> : null}
            {isSaving ? "Enregistrement..." : "ENREGISTRER"}
          </button>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <div className="h-6 w-40 animate-pulse rounded-full bg-slate-200" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
            </div>
            <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        )}

        {!isLoading && company && !company.id && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-black/60">
            <span>Profil à compléter</span>
            <button
              type="button"
              disabled={testCreating}
              onClick={async () => {
                if (!supabase || !userId) {
                  toast.error("Utilisateur non authentifié.");
                  return;
                }
                setTestCreating(true);
                try {
                  const { data, error } = await supabase
                    .from("beyond_connect_companies")
                    .insert({
                      id: userId,
                      name: "Profil test",
                      city: "Rouen",
                      website: "",
                    })
                    .select()
                    .single();
                  if (error) {
                    toast.error(error.message || "Erreur lors de la création.");
                    return;
                  }
                  setCompany({ ...(data || {}), name: data?.name || "" });
                  toast.success("Profil test créé.");
                } finally {
                  setTestCreating(false);
                }
              }}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-black/70"
            >
              {testCreating ? "Création..." : "Créer un profil test"}
            </button>
          </div>
        )}

        {!isLoading && company && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6">
              <label className="text-sm font-semibold text-black">Logo</label>
              <div className="flex items-center gap-6">
                <label className="cursor-pointer">
                  <div
                    className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white"
                    style={{
                      border: "2px solid transparent",
                      backgroundImage:
                        "linear-gradient(white, white), linear-gradient(to right, #3b82f6, #8b5cf6)",
                      backgroundOrigin: "border-box",
                      backgroundClip: "content-box, border-box",
                    }}
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-black/50">Glisser un logo</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleLogoChange(event.target.files?.[0] || null)}
                  />
                </label>
                <p className="text-sm text-black/50">PNG, JPG ou SVG. Taille conseillée : 512px.</p>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="grid gap-6 md:grid-cols-[7fr_3fr]">
                <div>
                  <label className="text-sm font-semibold text-black">Nom de l'entreprise</label>
                  <input
                    value={company.name || ""}
                    onChange={(event) => updateField("name", event.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-sm text-black outline-none"
                    style={getFieldStyle(focusedField === "name")}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-black">Type d'entreprise</label>
                  <select
                    value={company.company_type || company.size || ""}
                    onChange={(event) => updateField("company_type", event.target.value)}
                    onFocus={() => setFocusedField("company_type")}
                    onBlur={() => setFocusedField(null)}
                    className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-sm text-black outline-none"
                    style={getFieldStyle(focusedField === "company_type")}
                  >
                    <option value="">Sélectionner</option>
                    {companyTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-black">Secteur d'activité</label>
                  <input
                    value={company.industry || ""}
                    onChange={(event) => updateField("industry", event.target.value)}
                    onFocus={() => setFocusedField("industry")}
                    onBlur={() => setFocusedField(null)}
                    className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-sm text-black outline-none"
                    style={getFieldStyle(focusedField === "industry")}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-black">Ville</label>
                  <input
                    value={company.city || ""}
                    onChange={(event) => updateField("city", event.target.value)}
                    onFocus={() => setFocusedField("city")}
                    onBlur={() => setFocusedField(null)}
                    className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-sm text-black outline-none"
                    style={getFieldStyle(focusedField === "city")}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-black">Présentation / Bio</label>
                <textarea
                  value={company.description || ""}
                  onChange={(event) => updateField("description", event.target.value)}
                  onFocus={() => setFocusedField("description")}
                  onBlur={() => setFocusedField(null)}
                  className="mt-2 min-h-[180px] w-full rounded-2xl bg-white px-4 py-3 text-sm text-black outline-none"
                  style={getFieldStyle(focusedField === "description")}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-black">Site web</label>
                  <input
                    value={company.website || ""}
                    onChange={(event) => updateField("website", event.target.value)}
                    onFocus={() => setFocusedField("website")}
                    onBlur={() => setFocusedField(null)}
                    className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-sm text-black outline-none"
                    style={getFieldStyle(focusedField === "website")}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-black">Slogan</label>
                  <input
                    value={company.slogan || ""}
                    onChange={(event) => updateField("slogan", event.target.value)}
                    onFocus={() => setFocusedField("slogan")}
                    onBlur={() => setFocusedField(null)}
                    className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-sm text-black outline-none"
                    style={getFieldStyle(focusedField === "slogan")}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-black">Valeurs principales</label>
                  <input
                    value={company.values || ""}
                    onChange={(event) => updateField("values", event.target.value)}
                    onFocus={() => setFocusedField("values")}
                    onBlur={() => setFocusedField(null)}
                    className="mt-2 w-full rounded-xl bg-white px-4 py-3 text-sm text-black outline-none"
                    style={getFieldStyle(focusedField === "values")}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="fixed bottom-5 right-5 z-20 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition-all hover:scale-[1.02] md:hidden"
      >
        {showSaveCheck ? <Check className="h-4 w-4 text-green-200" /> : null}
        {isSaving ? "Enregistrement..." : "Enregistrer"}
      </button>
    </div>
  );
}
