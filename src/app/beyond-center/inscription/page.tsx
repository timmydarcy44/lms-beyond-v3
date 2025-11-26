"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function BeyondCenterSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const primaryColor = "#000000";
  const secondaryColor = "#1A1A1A";
  const textColor = "#000000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
          },
        },
      });

      if (error) throw error;

      const firstNameDisplay = firstName || email.split("@")[0];
      toast.success(`${firstNameDisplay}, je viens de vous envoyer un mail pour valider votre inscription`);

      // Rediriger vers la page de ressources après inscription
      setTimeout(() => {
        router.push("/beyond-center-app");
        router.refresh();
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F9FAFB" }}>
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative">
        {/* Pattern subtil */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-12 z-10">
          <div className="text-white text-center">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">Rejoignez Beyond Center</h2>
            <p className="text-xl text-gray-300 font-light">
              Commencez votre parcours de développement des compétences dès aujourd'hui
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-lg border-2"
                style={{ 
                  backgroundColor: primaryColor,
                  color: "#FFFFFF",
                  borderColor: primaryColor
                }}
              >
                BC
              </div>
              <span className="text-2xl font-bold tracking-tight" style={{ color: textColor }}>
                Beyond Center
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: textColor }}>
              Créer un compte
            </h1>
            <p className="text-gray-600">
              Inscrivez-vous pour accéder à l'écosystème Beyond Center
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" style={{ color: textColor }}>
                  Prénom
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Jean"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  style={{ color: textColor }}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" style={{ color: textColor }}>
                  Nom
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Dupont"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  style={{ color: textColor }}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: textColor }}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ color: textColor }}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: textColor }}>
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ color: textColor }}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" style={{ color: textColor }}>
                Confirmer le mot de passe
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                style={{ color: textColor }}
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full text-white"
              style={{ backgroundColor: primaryColor }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = secondaryColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = primaryColor;
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscription...
                </>
              ) : (
                "Créer mon compte"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Déjà un compte ?{" "}
              <Link 
                href="/beyond-center/login"
                className="font-medium hover:underline"
                style={{ color: primaryColor }}
              >
                Se connecter
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              En créant un compte, vous acceptez nos{" "}
              <Link href="/beyond-center/cgu" className="hover:underline" style={{ color: primaryColor }}>
                Conditions d'utilisation
              </Link>{" "}
              et notre{" "}
              <Link href="/beyond-center/confidentialite" className="hover:underline" style={{ color: primaryColor }}>
                Politique de confidentialité
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

