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
  /** Profil minimal pour préremplissage ; rechargé quand initialProfileRefreshed change */
  initialProfile: ProfileShape | null;
  refreshToken?: number;
  onSaved?: () => void;
};

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
      <DialogContent className="max-w-lg rounded-3xl border border-white/[0.1] bg-[#10151c] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier mon profil</DialogTitle>
          <DialogDescription className="text-white/55">
            Ces informations sont visibles par votre CFA sur la fiche apprenant (Beyond Connect École).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          <label className="block text-xs font-medium text-white/70">
            Photo de profil
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              className="mt-2 block w-full text-xs text-white/80 file:mr-2 file:rounded-lg file:border-0 file:bg-violet-500/80 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void persistAvatar(f);
                e.target.value = "";
              }}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-white/70">
              Prénom
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
              />
            </label>
            <label className="text-xs text-white/70">
              Nom
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
              />
            </label>
          </div>
          <label className="text-xs text-white/70">
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
            />
          </label>
          <label className="text-xs text-white/70">
            Téléphone
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
            />
          </label>
          {linkedSchool ? (
            <label className="text-xs text-white/70">
              Cursus / classe <span className="text-white/40">(visible côté école)</span>
              <input
                value={schoolClass}
                onChange={(e) => setSchoolClass(e.target.value)}
                placeholder="Ex. BTS MCO 2ᵉ année"
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50"
              />
            </label>
          ) : null}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border border-white/15 bg-transparent px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/5"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={saving || uploading}
            onClick={() => void saveIdentity()}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
