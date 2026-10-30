"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { suggestProfessionalEmail } from "@/lib/entreprise/signup-fields";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Role = "admin_hr" | "manager";

type Added = {
  id: string;
  email: string;
  role: Role;
};

type Props = {
  organisationId: string;
  viewerName?: string;
  viewerEmail?: string;
  onBack?: () => void;
  onNext: () => void;
};

const ADMIN_LIMIT = 3;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function nameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "Collegue";
  return local
    .replace(/[._+-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("fr") + part.slice(1))
    .join(" ");
}

export function AdminTeamStep({ organisationId, viewerName, viewerEmail, onBack, onNext }: Props) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [me, setMe] = useState<{ full_name: string; email: string } | null>(
    viewerName || viewerEmail ? { full_name: viewerName || "Vous", email: viewerEmail || "" } : null,
  );
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("admin_hr");
  const [added, setAdded] = useState<Added[]>([]);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user?.id) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();
      setMe({
        full_name: String(profile?.full_name ?? user.user_metadata?.full_name ?? "").trim() || "Vous",
        email: String(profile?.email ?? user.email ?? ""),
      });
    })();
  }, [supabase]);

  const used = 1 + added.length;
  const suggestion = suggestProfessionalEmail(email);
  const atLimit = used >= ADMIN_LIMIT;

  const addColleague = () => {
    const next = normalizeEmail(email);
    if (!isValidEmail(next) || suggestion) {
      setFieldError(suggestion ? `Vous vouliez dire ${suggestion} ?` : "Cette adresse email n'est pas valide.");
      return;
    }
    if (me && next === normalizeEmail(me.email)) {
      setFieldError("Cette adresse est déjà la vôtre.");
      return;
    }
    if (added.some((row) => row.email === next)) {
      setFieldError("Ce collègue est déjà dans la liste.");
      return;
    }
    if (atLimit) return;
    setAdded((prev) => [...prev, { id: crypto.randomUUID(), email: next, role }]);
    setEmail("");
    setFieldError(null);
  };

  const submit = async () => {
    if (added.length === 0) {
      onNext();
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/onboarding/organisation/${organisationId}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admins: added.map((row) => ({
            email: row.email,
            full_name: nameFromEmail(row.email),
            role: row.role,
          })),
        }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string; detail?: string } | null;
      if (!res.ok) throw new Error(json?.error || json?.detail || "Enregistrement impossible.");
      onNext();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-[36px] font-extrabold leading-tight tracking-[-1.2px]">Qui gère l&apos;espace avec vous ?</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-[#6B6F7A]">
        Ajoutez vos collègues RH ou managers. Ils reçoivent une invitation.
      </p>

      <div
        className="relative mt-8 overflow-hidden rounded-[24px] p-6 text-white"
        style={{ background: "radial-gradient(ellipse 80% 80% at 100% 0%, #6E5BFF59, transparent 60%), #070C1C" }}
      >
        <span className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#6E5BFF33]" aria-hidden />
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6E5BFF] text-[16px] font-extrabold">
            {(me?.full_name ?? "V").slice(0, 1).toLocaleUpperCase("fr")}
          </span>
          <div>
            <p className="text-[16px] font-extrabold">{me ? `${me.full_name} · vous` : "Chargement…"}</p>
            <p className="text-[14px] text-[#B5BAC6]">{me?.email}</p>
          </div>
          <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-[12px] font-extrabold">DRH principal</span>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-[#E3E0D8] bg-white p-5">
        {added.length > 0 ? (
          <ul className="mb-4 space-y-3">
            {added.map((row) => (
              <li key={row.id} className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EEEBFF] text-[13px] font-extrabold text-[#4B3BD1]">
                  {row.email.slice(0, 1).toLocaleUpperCase("fr")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-extrabold">{row.email}</p>
                  <p className="text-[12px] text-[#6B6F7A]">Invitation envoyée quand vous continuez</p>
                </div>
                <span className="rounded-full bg-[#F4F4F1] px-3 py-1 text-[12px] font-extrabold">
                  {row.role === "manager" ? "Manager" : "Admin RH"}
                </span>
                <button
                  type="button"
                  aria-label={`Retirer ${row.email}`}
                  onClick={() => setAdded((prev) => prev.filter((item) => item.id !== row.id))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E3E0D8] text-[18px]"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="mb-2 block text-[13px] font-extrabold">Email d&apos;un collègue</span>
            <input
              type="email"
              value={email}
              inputMode="email"
              autoComplete="email"
              aria-invalid={Boolean(fieldError)}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addColleague();
                }
              }}
              className={`h-14 w-full rounded-[18px] bg-white px-4 text-[16px] outline-none focus:ring-2 focus:ring-[#6E5BFF] ${
                fieldError ? "border-[1.5px] border-[#D6334A]" : "border border-[#E3E0D8]"
              }`}
            />
          </label>
          <div className="flex h-14 rounded-full bg-[#F4F4F1] p-1" role="radiogroup" aria-label="Rôle">
            {(
              [
                ["admin_hr", "Admin RH"],
                ["manager", "Manager"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={role === id}
                onClick={() => setRole(id)}
                className={`rounded-full px-4 text-[13px] font-extrabold ${
                  role === id ? "bg-[#07080B] text-white" : "text-[#6B6F7A]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={addColleague}
            disabled={atLimit}
            className="h-14 rounded-full bg-[#07080B] px-5 text-[14px] font-extrabold text-white disabled:opacity-40"
          >
            Ajouter
          </button>
        </div>
        {suggestion ? (
          <p role="alert" className="mt-2 text-[13px] font-semibold text-[#B42318]">
            Vous vouliez dire{" "}
            <button type="button" className="font-extrabold underline" onClick={() => setEmail(suggestion)}>
              {suggestion}
            </button>{" "}
            ?
          </p>
        ) : fieldError ? (
          <p role="alert" className="mt-2 text-[13px] font-semibold text-[#B42318]">
            {fieldError}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <div className="flex gap-1">
          {Array.from({ length: ADMIN_LIMIT }, (_, index) => (
            <span key={index} className={`h-1.5 flex-1 rounded-full ${index < used ? "bg-[#6E5BFF]" : "bg-[#E3E0D8]"}`} />
          ))}
        </div>
        <p className="mt-2 text-[13px] text-[#6B6F7A]">
          {used} / {ADMIN_LIMIT} licences admin utilisées pendant l&apos;essai
        </p>
        {atLimit ? (
          <p className="mt-1 text-[13px] font-semibold text-[#3A3D45]">Passez à l&apos;offre Grow pour plus d&apos;administrateurs.</p>
        ) : null}
      </div>

      <div className="mt-8 flex items-center gap-3">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="Retour" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#E3E0D8] bg-white text-[22px]">
            ‹
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving}
          className="h-14 flex-1 rounded-full bg-[#6E5BFF] text-[16px] font-extrabold text-white disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Continuer"}
        </button>
      </div>
    </div>
  );
}
