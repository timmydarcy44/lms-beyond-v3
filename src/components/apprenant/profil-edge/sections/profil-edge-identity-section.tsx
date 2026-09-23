"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Camera, Check, Loader2, Pencil } from "lucide-react";
import { ProfileAvatarUploader } from "@/components/apprenant/profile-avatar-uploader";
import { useProfilEdgeSaveReturn } from "@/components/apprenant/profil-edge/use-profil-edge-save-return";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import { PROFIL_EDGE_SECTION_BASE } from "@/lib/particulier/profil-edge-maturity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type StepId = "photo" | "coords" | "confirm";

const STEPS: StepId[] = ["photo", "coords", "confirm"];

function formatBirthDate(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR");
}

export function ProfilEdgeIdentitySection() {
  const supabase = createSupabaseBrowserClient();
  const { savedMessage, finishSave } = useProfilEdgeSaveReturn();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [editing, setEditing] = useState({ phone: false, city: false, birth_date: false });
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    city: "",
    birth_date: "",
    avatar_url: "",
  });

  const step = STEPS[stepIndex] ?? "photo";

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, telephone, city, birth_date, avatar_url")
      .eq("id", uid)
      .maybeSingle();
    if (data) {
      const phone = String(data.phone ?? data.telephone ?? "").trim();
      const city = String(data.city ?? "").trim();
      const birthDate = String(data.birth_date ?? "").trim();
      const next = {
        first_name: String(data.first_name ?? ""),
        last_name: String(data.last_name ?? ""),
        email: String(data.email ?? userData.user?.email ?? ""),
        phone,
        city,
        birth_date: birthDate,
        avatar_url: String(data.avatar_url ?? ""),
      };
      setForm(next);
      const complete =
        Boolean(next.first_name.trim()) &&
        Boolean(next.last_name.trim()) &&
        Boolean(next.email.trim()) &&
        Boolean(next.phone) &&
        Boolean(next.city) &&
        Boolean(next.avatar_url);
      if (complete) setStepIndex(STEPS.indexOf("confirm"));
    }
  }, [supabase]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const save = async () => {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setSaving(false);
      return;
    }
    await supabase
      .from("profiles")
      .update({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        telephone: form.phone.trim(),
        city: form.city.trim(),
        birth_date: form.birth_date.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
      })
      .eq("id", uid);
    setSaving(false);
    finishSave();
  };

  const canContinue = useMemo(() => {
    if (step === "photo") return Boolean(form.avatar_url.trim());
    if (step === "coords") {
      return (
        Boolean(form.first_name.trim()) &&
        Boolean(form.last_name.trim()) &&
        Boolean(form.phone.trim()) &&
        Boolean(form.city.trim())
      );
    }
    return true;
  }, [form, step]);

  const filledCount = [
    form.first_name,
    form.last_name,
    form.email,
    form.phone,
    form.city,
    form.avatar_url,
  ].filter((v) => v.trim()).length;

  if (loading) return <p className="text-sm text-white/50">Chargement…</p>;

  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white outline-none placeholder:text-white/25 focus:border-[#3D7BFF]/45";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col pb-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            className="inline-flex items-center gap-1.5 text-sm text-white/45 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        ) : (
          <Link
            href={PROFIL_EDGE_SECTION_BASE}
            className="inline-flex items-center gap-1.5 text-sm text-white/45 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Profil
          </Link>
        )}
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/30">
          {filledCount}/6 · {stepIndex + 1}/{STEPS.length}
        </span>
      </div>

      <div className="mb-8 h-1 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-[#3D7BFF] transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {step === "photo" ? (
        <>
          <header className="mb-8 space-y-2">
            <h1 className="text-[1.85rem] font-bold leading-[1.15] tracking-[-0.04em] text-white sm:text-[2.1rem]">
              Votre photo
            </h1>
            <p className="text-[15px] leading-relaxed text-white/45">
              C’est la première chose que l’on voit sur votre profil EDGE.
            </p>
          </header>
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div
              className={cn(
                "relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-2",
                form.avatar_url
                  ? "border-[#3D7BFF]/50"
                  : "border-dashed border-white/20 bg-white/[0.03]",
              )}
            >
              {form.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-10 w-10 text-white/25" />
              )}
            </div>
            <ProfileAvatarUploader
              currentUrl={form.avatar_url || null}
              onUploaded={(url) => setForm((f) => ({ ...f, avatar_url: url }))}
            />
          </div>
        </>
      ) : null}

      {step === "coords" ? (
        <>
          <header className="mb-8 space-y-2">
            <h1 className="text-[1.85rem] font-bold leading-[1.15] tracking-[-0.04em] text-white sm:text-[2.1rem]">
              Qui êtes-vous ?
            </h1>
            <p className="text-[15px] leading-relaxed text-white/45">
              Ces infos personnalisent votre expérience. L’e-mail reste lié à votre compte.
            </p>
          </header>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[12px] text-white/40">Prénom</span>
                <input
                  className={inputClass}
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12px] text-white/40">Nom</span>
                <input
                  className={inputClass}
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                />
              </label>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
              <p className="text-[12px] text-white/35">E-mail</p>
              <p className="mt-0.5 text-[15px] text-white/70">{form.email || "—"}</p>
            </div>

            {(
              [
                { key: "phone" as const, label: "Téléphone", type: "tel" },
                { key: "city" as const, label: "Ville", type: "text" },
                { key: "birth_date" as const, label: "Date de naissance", type: "date" },
              ] as const
            ).map(({ key, label, type }) => {
              const isLocked = Boolean(form[key].trim()) && !editing[key];
              return (
                <div key={key}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[12px] text-white/40">{label}</span>
                    {form[key].trim() ? (
                      <button
                        type="button"
                        onClick={() => setEditing((s) => ({ ...s, [key]: !s[key] }))}
                        className="inline-flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70"
                      >
                        <Pencil className="h-3 w-3" />
                        {editing[key] ? "OK" : "Modifier"}
                      </button>
                    ) : null}
                  </div>
                  {isLocked ? (
                    <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-[15px] text-white">
                      {key === "birth_date" ? formatBirthDate(form[key]) : form[key]}
                    </p>
                  ) : (
                    <input
                      type={type}
                      className={inputClass}
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {step === "confirm" ? (
        <>
          <header className="mb-8 space-y-2">
            <h1 className="text-[1.85rem] font-bold leading-[1.15] tracking-[-0.04em] text-white sm:text-[2.1rem]">
              Votre identité
            </h1>
            <p className="text-[15px] leading-relaxed text-white/45">
              Vérifiez avant d’enregistrer.
            </p>
          </header>
          <div className="rounded-[1.35rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-white/5">
                {form.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/30">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-[1.25rem] font-bold tracking-[-0.03em] text-white">
                  {form.first_name} {form.last_name}
                </p>
                <p className="mt-0.5 text-[13px] text-white/45">{form.email}</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2.5 border-t border-white/[0.06] pt-4 text-[14px]">
              <li className="flex justify-between gap-3">
                <span className="text-white/40">Téléphone</span>
                <span className="text-white/80">{form.phone || "—"}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-white/40">Ville</span>
                <span className="text-white/80">{form.city || "—"}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-white/40">Naissance</span>
                <span className="text-white/80">{formatBirthDate(form.birth_date)}</span>
              </li>
            </ul>
            {filledCount >= 6 ? (
              <p className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-emerald-400/90">
                <Check className="h-3.5 w-3.5" /> Identité complète
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setStepIndex(0)}
            className="mt-4 text-sm text-[#9EC0FF] hover:underline"
          >
            Modifier
          </button>
        </>
      ) : null}

      {savedMessage ? <p className="mt-4 text-sm text-emerald-400">{savedMessage}</p> : null}

      <div className="sticky bottom-0 mt-8 bg-gradient-to-t from-[#05060a] via-[#05060a] to-transparent pt-4">
        {step === "confirm" ? (
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className={cn(CONNECT_BTN_PRIMARY, "h-12 w-full justify-center text-[15px]")}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enregistrer mon identité
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
            disabled={!canContinue}
            className={cn(
              CONNECT_BTN_PRIMARY,
              "h-12 w-full justify-center gap-2 text-[15px]",
              !canContinue && "pointer-events-none opacity-40",
            )}
          >
            Continuer
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
