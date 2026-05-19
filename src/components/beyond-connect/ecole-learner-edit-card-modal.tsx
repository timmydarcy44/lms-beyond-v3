"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learnerId: string;
  schoolId: string | null;
  profile: Record<string, unknown>;
  initialHost: string | null;
  initialPlacement: string | null;
  initialDob: string | null;
  initialPermis: boolean | null;
};

export function EcoleLearnerEditCardModal(props: Props) {
  const {
    open,
    onOpenChange,
    learnerId,
    schoolId,
    profile,
    initialHost,
    initialPlacement,
    initialDob,
    initialPermis,
  } = props;

  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolClass, setSchoolClass] = useState("");
  const [dob, setDob] = useState("");
  const [permis, setPermis] = useState<boolean | "">("");
  const [track, setTrack] = useState<"auto" | "initial">("auto");

  const hostPresent = Boolean(initialHost);

  useEffect(() => {
    if (!open) return;
    setFirstName(String(profile.first_name ?? "").trim());
    setLastName(String(profile.last_name ?? "").trim());
    setEmail(String(profile.email ?? "").trim());
    setPhone(
      profile.phone != null && String(profile.phone).trim()
        ? String(profile.phone).trim()
        : profile.telephone != null
          ? String(profile.telephone).trim()
          : "",
    );
    setSchoolClass(profile.school_class != null ? String(profile.school_class).trim() : "");
    setDob(
      initialDob && /^\d{4}-\d{2}-\d{2}/.test(initialDob) ? initialDob.slice(0, 10) : "",
    );
    setPermis(initialPermis === true ? true : initialPermis === false ? false : "");
    setTrack(initialPlacement === "initial" ? "initial" : "auto");
  }, [open, profile, initialDob, initialPermis, initialPlacement]);

  const canSaveInitial = useMemo(() => !hostPresent, [hostPresent]);

  const save = async () => {
    if (!schoolId) {
      toast.error("École non identifiée.");
      return;
    }
    if (track === "initial" && hostPresent) {
      toast.error("Retirez l'entreprise d'accueil sur la fiche avant de choisir « Initial ».");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/ecole/apprenants/alternance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learnerId,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          school_class: schoolClass.trim() || null,
          date_of_birth: dob.trim() || null,
          has_driving_license_b: permis === "" ? null : permis === true,
          placement_mode: track === "initial" ? "initial" : "auto",
        }),
      });
      const data = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;
      if (!res.ok || !data?.success) throw new Error(data?.error || "Enregistrement impossible");
      toast.success("Fiche mise à jour.");
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Modifier la carte apprenant</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-zinc-500">
          Identité, coordonnées et type de parcours (hors soft skills, wallet et liens portfolio). L&apos;entreprise
          d&apos;accueil et le tuteur se modifient dans la section prévue sur la fiche.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold text-zinc-500">Prénom</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-zinc-100"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold text-zinc-500">Nom</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-zinc-100"
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="text-xs font-semibold text-zinc-500">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-zinc-100"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold text-zinc-500">Téléphone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-zinc-100"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold text-zinc-500">Classe / cursus</span>
            <input
              value={schoolClass}
              onChange={(e) => setSchoolClass(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-zinc-100"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold text-zinc-500">Date de naissance</span>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-zinc-100"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-xs font-semibold text-zinc-500">Permis B</span>
            <select
              value={permis === true ? "yes" : permis === false ? "no" : ""}
              onChange={(e) => {
                const v = e.target.value;
                setPermis(v === "yes" ? true : v === "no" ? false : "");
              }}
              className="w-full rounded-xl border border-white/15 bg-zinc-900 px-3 py-2 text-zinc-100"
            >
              <option value="">— Non renseigné —</option>
              <option value="yes">Oui</option>
              <option value="no">Non</option>
            </select>
          </label>
        </div>

        <fieldset className="mt-5 space-y-2 rounded-xl border border-white/10 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-violet-300/90">
            Parcours & statut
          </legend>
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="radio"
              name="track"
              checked={track === "auto"}
              onChange={() => setTrack("auto")}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-white">Suivi automatique</span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                Statut « en recherche d&apos;alternance » ou « en alternance » selon qu&apos;une entreprise est liée.
              </span>
            </span>
          </label>
          <label className={`flex cursor-pointer items-start gap-2 text-sm ${!canSaveInitial ? "opacity-50" : ""}`}>
            <input
              type="radio"
              name="track"
              disabled={!canSaveInitial}
              checked={track === "initial"}
              onChange={() => setTrack("initial")}
              className="mt-1"
            />
            <span>
              <span className="font-medium text-white">Initial</span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                Parcours sans entreprise (uniquement si aucune entreprise n&apos;est liée).
              </span>
            </span>
          </label>
        </fieldset>

        <div className="mt-6 flex justify-end gap-2 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full border border-white/20 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
          >
            Fermer
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer la fiche"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
