"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fieldClass = "border-white/10 bg-white/5 text-white";

function splitName(fullName: string | null | undefined, first?: string | null, last?: string | null) {
  if (first || last) {
    return { firstName: (first ?? "").trim(), lastName: (last ?? "").trim() };
  }
  const parts = String(fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function EsrAccountSettings() {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, full_name, name, email")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const names = splitName(profile?.full_name ?? profile?.name, profile?.first_name, profile?.last_name);
      setUserId(user.id);
      setEmail(user.email ?? profile?.email ?? "");
      setFirstName(names.firstName);
      setLastName(names.lastName);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const saveProfile = async () => {
    if (!userId) {
      toast.error("Session introuvable. Reconnectez-vous.");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Le nom et le prénom sont obligatoires.");
      return;
    }
    setSavingProfile(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: fullName,
          name: fullName,
        })
        .eq("id", userId);
      if (error) throw error;
      await supabase.auth.updateUser({
        data: { first_name: firstName.trim(), last_name: lastName.trim(), full_name: fullName },
      });
      toast.success("Informations enregistrées");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible d'enregistrer le profil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!email) {
      toast.error("Session introuvable. Reconnectez-vous.");
      return;
    }
    if (!currentPassword) {
      toast.error("Indiquez votre mot de passe actuel.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("La confirmation ne correspond pas.");
      return;
    }
    setSavingPassword(true);
    try {
      const { error: checkError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (checkError) {
        toast.error("Mot de passe actuel incorrect.");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Mot de passe mis à jour");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de modifier le mot de passe.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-sm text-white/50">Chargement du compte…</div>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mon compte</h1>
        <p className="mt-1 text-sm text-white/50">Vos informations personnelles et votre mot de passe.</p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#2A1016] p-6">
        <h2 className="text-lg font-semibold text-white">Identité</h2>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Prénom</Label>
              <Input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Prénom"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Nom"
                className={fieldClass}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Adresse e-mail</Label>
            <Input value={email} disabled className="border-white/10 bg-white/5 text-white/50" />
            <p className="text-xs text-white/40">L&apos;e-mail ne peut pas être modifié.</p>
          </div>
          <button
            className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--club-primary, #8B1A2B)" }}
            onClick={() => void saveProfile()}
            disabled={savingProfile}
          >
            {savingProfile ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#2A1016] p-6">
        <h2 className="text-lg font-semibold text-white">Mot de passe</h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Mot de passe actuel</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={fieldClass}
              autoComplete="current-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Nouveau mot de passe</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={fieldClass}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirmer le nouveau mot de passe</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={fieldClass}
              autoComplete="new-password"
            />
          </div>
          <button
            className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--club-primary, #8B1A2B)" }}
            onClick={() => void savePassword()}
            disabled={savingPassword}
          >
            {savingPassword ? "Mise à jour…" : "Modifier le mot de passe"}
          </button>
        </div>
      </section>
    </div>
  );
}
