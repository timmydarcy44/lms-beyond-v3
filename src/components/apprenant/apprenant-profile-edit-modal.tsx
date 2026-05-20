"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ProfileShape = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  telephone?: string | null;
  school_class?: string | null;
  school_id?: string | null;
  avatar_url?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProfile: ProfileShape | null;
  refreshToken?: number;
  onSaved?: () => void;
};

const inputClass =
  "mt-2 w-full rounded-xl border border-black/[0.06] bg-[#f5f5f3] px-3 py-2 text-sm text-[#0a0a0a] outline-none focus:border-edge-red/50";

export function ApprenantProfileEditModal({
  open,
  onOpenChange,
  initialProfile,
  refreshToken = 0,
  onSaved,
}: Props) {
  const supabase = createSupabaseBrowserClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolClass, setSchoolClass] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open || !initialProfile) return;
    setFirstName(String(initialProfile.first_name ?? "").trim());
    setLastName(String(initialProfile.last_name ?? "").trim());
    setEmail(String(initialProfile.email ?? "").trim());
    const tel =
      initialProfile.phone != null && String(initialProfile.phone).trim()
        ? String(initialProfile.phone).trim()
        : String(initialProfile.telephone ?? "").trim();
    setPhone(tel);
    setSchoolClass(String(initialProfile.school_class ?? "").trim());
  }, [open, initialProfile, refreshToken]);

  const persistAvatar = async (file: File) => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) {
      toast.error("Session invalide.");
      return;
    }
    setUploading(true);
    try {
      const extension = file.name.split(".").pop() || "jpg";
      const path = `${uid}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) {
        toast.error("Upload photo impossible", { description: uploadError.message });
        return;
      }
      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = pub?.publicUrl;
      if (!publicUrl) return;

      const res = await fetch("/api/beyond-connect/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: publicUrl }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error || "Mise à jour refusée");
      }
      toast.success("Photo enregistrée.");
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setUploading(false);
    }
  };

  const saveIdentity = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Prénom et nom sont obligatoires.");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
      };
      if (email.trim()) body.email = email.trim().toLowerCase();
      if (initialProfile?.school_id && schoolClass.trim()) {
        body.school_class = schoolClass.trim();
      }
      const res = await fetch("/api/beyond-connect/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(j?.error || "Enregistrement impossible");
      toast.success("Profil mis à jour.");
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const linkedSchool = Boolean(initialProfile?.school_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl border border-black/[0.06] bg-white text-[#0a0a0a] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-medium text-[#0a0a0a]">Modifier mon profil</DialogTitle>
          <DialogDescription className="text-black/45">
            Ces informations sont visibles par votre CFA sur la fiche apprenant (Beyond Connect École).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <label className="block text-xs font-medium text-black/60">
            Photo de profil
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              className="mt-2 block w-full text-xs text-black/70 file:mr-2 file:rounded-lg file:border-0 file:bg-edge-red file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void persistAvatar(f);
                e.target.value = "";
              }}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-black/60">
              Prénom
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
            </label>
            <label className="text-xs text-black/60">
              Nom
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
            </label>
          </div>
          <label className="text-xs text-black/60">
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </label>
          <label className="text-xs text-black/60">
            Téléphone
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </label>
          {linkedSchool ? (
            <label className="text-xs text-black/60">
              Cursus / classe <span className="text-black/40">(visible côté école)</span>
              <input
                value={schoolClass}
                onChange={(e) => setSchoolClass(e.target.value)}
                placeholder="Ex. BTS MCO 2ᵉ année"
                className={inputClass}
              />
            </label>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <button type="button" onClick={() => onOpenChange(false)} className={CONNECT_BTN_SECONDARY}>
            Annuler
          </button>
          <button
            type="button"
            disabled={saving || uploading}
            onClick={() => void saveIdentity()}
            className={`${CONNECT_BTN_PRIMARY} disabled:opacity-50`}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
