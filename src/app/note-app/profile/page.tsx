"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, BookOpen } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function NoteAppProfilePage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setError("Merci de vous reconnecter.");
        return;
      }
      setEmail(userData.user.email || "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", userData.user.id)
        .maybeSingle();
      setFirstName(profile?.first_name || "");
      setLastName(profile?.last_name || "");
    };
    loadProfile();
  }, [supabase]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Merci de renseigner prénom et nom.");
      return;
    }
    if (password || confirm) {
      if (password.length < 8) {
        setError("Le mot de passe doit contenir au moins 8 caractères.");
        return;
      }
      if (password !== confirm) {
        setError("Les mots de passe ne correspondent pas.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setError("Session expirée. Merci de vous reconnecter.");
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ first_name: firstName.trim(), last_name: lastName.trim() })
        .eq("id", userData.user.id);

      if (profileError) {
        setError(profileError.message);
        return;
      }

      if (password) {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
          setError(updateError.message);
          return;
        }
      }

      setPassword("");
      setConfirm("");
      setSuccess("Profil mis à jour.");
    } catch {
      setError("Impossible d'enregistrer les modifications.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      window.location.href = "https://www.nevo-app.fr/app-landing/login";
    } catch {
      setError("Erreur lors de la déconnexion.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-[#0F1117]">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-64 bg-[#be1354] text-white flex-col">
          <div className="px-6 py-6">
            <img
              src="https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png"
              alt="Nevo"
              className="h-14 object-contain"
            />
          </div>
          <div className="px-4 space-y-2 mb-4">
            <button
              type="button"
              onClick={() => router.push("/note-app")}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all hover:bg-white/10"
            >
              <BookOpen className="h-4 w-4 text-white" />
              <span className="text-sm">Bibliothèque</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/note-app/profile")}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all bg-white/20"
            >
              <User className="h-4 w-4 text-white" />
              <span className="text-sm">Mon Profil</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-left transition-all hover:bg-white/10 text-white/90"
            >
              <LogOut className="h-4 w-4 text-white" />
              <span className="text-sm">{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 px-6 py-12">
          <div className="mx-auto w-full max-w-xl rounded-3xl bg-white border border-[#E8E9F0] p-8 shadow-sm">
            <h1 className="text-2xl font-semibold mb-2">Mon Profil</h1>
            <p className="text-sm text-[#6B7280] mb-6">
              Gérez vos informations personnelles et votre mot de passe.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Prénom"
                  className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
                  required
                />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Nom"
                  className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
                  required
                />
              </div>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-2xl border border-[#E8E9F0] bg-[#F3F4F8] px-4 py-3 text-sm text-[#6B7280]"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nouveau mot de passe"
                className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirmation du mot de passe"
                className="w-full rounded-2xl border border-[#E8E9F0] px-4 py-3 text-sm outline-none focus:border-[#be1354]"
              />
              {error ? <p className="text-xs text-red-500">{error}</p> : null}
              {success ? <p className="text-xs text-green-600">{success}</p> : null}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full rounded-full px-5 py-3 text-white font-semibold"
                style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
              >
                {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
