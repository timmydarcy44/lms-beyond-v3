"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LogOut, Save } from "lucide-react";
import { getUserName } from "@/lib/utils/user-name";

// Couleurs de branding Jessica Contentin
const surfaceColor = "#F8F5F0";
const textColor = "#2F2A25";
const primaryColor = "#C6A664";

export function ProfileSection({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        const fullName = profile.full_name || "";
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        setFormData({
          firstName,
          lastName,
          email: profile.email || user.email || "",
          phone: profile.phone || "",
        });
      } else {
        setFormData({
          firstName: "",
          lastName: "",
          email: user.email || "",
          phone: "",
        });
      }
    } catch (error) {
      console.error("[profile-section] Error loading profile:", error);
      toast.error("Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Session expirée");
        return;
      }

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      // Mettre à jour le profil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          phone: formData.phone || null,
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      toast.success("Profil mis à jour avec succès");
    } catch (error: any) {
      console.error("[profile-section] Error updating profile:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setPasswordSaving(true);

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Session expirée");
        return;
      }

      // Vérifier le mot de passe actuel
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      });

      if (signInError) {
        toast.error("Mot de passe actuel incorrect");
        return;
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      toast.success("Mot de passe mis à jour avec succès");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("[profile-section] Error updating password:", error);
      toast.error(error.message || "Erreur lors de la mise à jour du mot de passe");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Éviter les doubles clics
    
    try {
      setIsLoggingOut(true);
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setIsLoggingOut(false);
        return;
      }

      console.log("[profile-section] Starting logout...");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[profile-section] SignOut error:", error);
        throw error;
      }

      console.log("[profile-section] SignOut successful, redirecting...");
      // Attendre un peu pour que la déconnexion soit complète
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Rediriger vers la page d'accueil
      window.location.href = "/jessica-contentin";
    } catch (error: any) {
      console.error("[profile-section] Error logging out:", error);
      toast.error("Erreur lors de la déconnexion");
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-xl" style={{ backgroundColor: surfaceColor, border: `1px solid ${primaryColor}30` }}>
        <p style={{ color: `${textColor}80` }}>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Informations personnelles */}
      <div 
        className="p-6 rounded-xl"
        style={{ 
          backgroundColor: surfaceColor,
          border: `1px solid ${primaryColor}30`,
        }}
      >
        <h2 
          className="text-2xl font-semibold mb-6"
          style={{ color: textColor }}
        >
          Informations personnelles
        </h2>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" style={{ color: textColor }}>
                Prénom
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="mt-1"
                style={{ backgroundColor: "#FFFFFF" }}
              />
            </div>
            <div>
              <Label htmlFor="lastName" style={{ color: textColor }}>
                Nom
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="mt-1"
                style={{ backgroundColor: "#FFFFFF" }}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" style={{ color: textColor }}>
              Adresse email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled
              className="mt-1"
              style={{ backgroundColor: "#F5F5F5", color: `${textColor}80` }}
            />
            <p className="text-xs mt-1" style={{ color: `${textColor}60` }}>
              L'adresse email ne peut pas être modifiée
            </p>
          </div>

          <div>
            <Label htmlFor="phone" style={{ color: textColor }}>
              Numéro de téléphone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1"
              style={{ backgroundColor: "#FFFFFF" }}
              placeholder="06 12 34 56 78"
            />
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="rounded-full px-6"
            style={{
              backgroundColor: primaryColor,
              color: '#FFFFFF',
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </form>
      </div>

      {/* Section Mot de passe */}
      <div 
        className="p-6 rounded-xl"
        style={{ 
          backgroundColor: surfaceColor,
          border: `1px solid ${primaryColor}30`,
        }}
      >
        <h2 
          className="text-2xl font-semibold mb-6"
          style={{ color: textColor }}
        >
          Modifier le mot de passe
        </h2>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword" style={{ color: textColor }}>
              Mot de passe actuel
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="mt-1"
              style={{ backgroundColor: "#FFFFFF" }}
            />
          </div>

          <div>
            <Label htmlFor="newPassword" style={{ color: textColor }}>
              Nouveau mot de passe
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="mt-1"
              style={{ backgroundColor: "#FFFFFF" }}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" style={{ color: textColor }}>
              Confirmer le nouveau mot de passe
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="mt-1"
              style={{ backgroundColor: "#FFFFFF" }}
            />
          </div>

          <Button
            type="submit"
            disabled={passwordSaving}
            className="rounded-full px-6"
            style={{
              backgroundColor: primaryColor,
              color: '#FFFFFF',
            }}
          >
            <Save className="h-4 w-4 mr-2" />
            {passwordSaving ? "Enregistrement..." : "Modifier le mot de passe"}
          </Button>
        </form>
      </div>

      {/* Bouton Déconnexion */}
      <div 
        className="p-6 rounded-xl relative z-[100]"
        style={{ 
          backgroundColor: surfaceColor,
          border: `1px solid ${primaryColor}30`,
        }}
      >
        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          variant="outline"
          className="rounded-full px-6 border-2 cursor-pointer relative z-[100] hover:bg-red-50 transition-colors"
          style={{
            borderColor: "#DC2626",
            color: "#DC2626",
            pointerEvents: "auto",
            position: "relative",
            zIndex: 100,
          }}
          type="button"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoggingOut ? "Déconnexion..." : "Me déconnecter"}
        </Button>
      </div>
    </div>
  );
}

