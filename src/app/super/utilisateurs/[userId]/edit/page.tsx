"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { updateUserDetails } from "./actions";

type UserDetails = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  access_lms: boolean | null;
  access_connect: boolean | null;
  access_care: boolean | null;
  access_pro: boolean | null;
};

export default function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [accessState, setAccessState] = useState({
    access_lms: false,
    access_connect: false,
    access_care: false,
    access_pro: false,
  });
  const [deleteEmail, setDeleteEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    params.then((p) => {
      setUserId(p.userId);
      fetchUserDetails(p.userId);
    });
  }, [params]);

  const fetchUserDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/super-admin/users/${id}`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des données");
      }
      const data = await response.json();
      setUserDetails(data);
      setSelectedRole(data.role || "");
      setAccessState({
        access_lms: Boolean(data.access_lms),
        access_connect: Boolean(data.access_connect),
        access_care: Boolean(data.access_care),
        access_pro: Boolean(data.access_pro),
      });
      setFormData({
        email: data.email || "",
        fullName: data.fullName || "",
        phone: data.phone || "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast.error("Erreur lors du chargement des données utilisateur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateUserDetails({
        userId,
        email: formData.email,
        fullName: formData.fullName || null,
        phone: formData.phone || null,
        password: formData.password || undefined,
      });

      if (result.success) {
        toast.success("Utilisateur mis à jour avec succès");
        router.push(`/super/utilisateurs/${userId}`);
        router.refresh();
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!userId) return;
    const previous = selectedRole;
    setSelectedRole(newRole);
    try {
      const response = await fetch(`/api/super/utilisateurs/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du rôle");
      }
      toast.success("Rôle mis à jour");
    } catch (error) {
      console.error("Error updating role:", error);
      setSelectedRole(previous);
      toast.error("Erreur lors de la mise à jour du rôle");
    }
  };

  const handleAccessToggle = async (field: keyof typeof accessState, value: boolean) => {
    if (!userId) return;
    setAccessState((prev) => ({ ...prev, [field]: value }));
    try {
      const response = await fetch(`/api/super/utilisateurs/${userId}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de l'accès");
      }
      toast.success("Accès mis à jour");
    } catch (error) {
      console.error("Error updating access:", error);
      setAccessState((prev) => ({ ...prev, [field]: !value }));
      toast.error("Erreur lors de la mise à jour de l'accès");
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId || !userDetails) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/super/utilisateurs/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }
      toast.success("Compte supprimé");
      router.push("/super/utilisateurs");
      router.refresh();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Utilisateur non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Link href={`/super/utilisateurs/${userId}`}>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Modifier {userDetails.fullName || userDetails.email}
          </h1>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Informations personnelles */}
          <Card className="border-gray-200 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                Informations Personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Mot de passe */}
          <Card className="border-gray-200 bg-gradient-to-br from-white to-purple-50/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Modifier le mot de passe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Laisser vide pour ne pas modifier"
                />
                <p className="text-xs text-gray-500">
                  Minimum 6 caractères. Laisser vide pour ne pas modifier le mot de passe.
                </p>
              </div>
              {formData.password && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirmer le nouveau mot de passe"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Accès & Permissions */}
        <Card className="border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-sm mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Accès & Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <select
                id="role"
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                <option value="student">Apprenant</option>
                <option value="admin">Administrateur</option>
                <option value="entreprise">Entreprise</option>
                <option value="tutor">Tuteur</option>
                <option value="PARTICULIER">Particulier B2C</option>
                <option value="mentor">Mentor</option>
              </select>
            </div>

            <div className="space-y-3">
              {[
                { key: "access_lms", label: "Accès LMS" },
                { key: "access_connect", label: "Accès Connect" },
                { key: "access_care", label: "Accès Care" },
                { key: "access_pro", label: "Accès Pro" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-md border border-gray-100 bg-white px-3 py-2">
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={accessState[item.key as keyof typeof accessState]}
                    onChange={(e) =>
                      handleAccessToggle(item.key as keyof typeof accessState, e.target.checked)
                    }
                    className="h-4 w-4"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Zone danger */}
        <Card className="border-red-200 bg-red-50 shadow-sm mt-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-700">Zone danger</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-700">Cette action est irréversible</p>
            <div className="space-y-2">
              <Label htmlFor="deleteEmail">Tapez l'email de l'utilisateur pour confirmer</Label>
              <Input
                id="deleteEmail"
                type="email"
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
              />
            </div>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteEmail !== userDetails.email || isDeleting}
              onClick={handleDeleteAccount}
            >
              {isDeleting ? "Suppression..." : "Supprimer le compte"}
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href={`/super/utilisateurs/${userId}`}>
            <Button variant="outline">Annuler</Button>
          </Link>
          <Button type="submit" disabled={isSaving} className="bg-black text-white hover:bg-gray-900">
            {isSaving ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}









