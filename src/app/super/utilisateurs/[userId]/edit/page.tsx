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
};

export default function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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





