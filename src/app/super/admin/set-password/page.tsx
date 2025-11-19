"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SetPasswordPage() {
  const [email, setEmail] = useState("paindany36@gmail.com");
  const [password, setPassword] = useState("caentraining14");
  const [isLoading, setIsLoading] = useState(false);

  const handleSetPassword = async () => {
    if (!email || !password) {
      toast.error("Email et mot de passe requis");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la définition du mot de passe");
      }

      toast.success(data.message || "Mot de passe défini avec succès!");
      console.log("✅ Utilisateur mis à jour:", data.user);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la définition du mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Définir un mot de passe pour un utilisateur</CardTitle>
          <p className="text-sm text-muted-foreground">
            Page temporaire pour définir un mot de passe. À supprimer après utilisation.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <Button onClick={handleSetPassword} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Définition en cours...
              </>
            ) : (
              "Définir le mot de passe"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}





