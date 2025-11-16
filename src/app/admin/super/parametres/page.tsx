import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, User, Mail } from "lucide-react";

export default async function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Paramètres Super Admin</h1>
        <p className="text-sm text-white/60">
          Configuration et gestion de l'accès super admin
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-yellow-400" />
              Accès Super Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/10 p-4">
              <p className="text-sm text-white/90">
                En tant que Super Admin, vous avez accès complet à toutes les données du système.
              </p>
              <p className="mt-2 text-xs text-white/60">
                Utilisez ce pouvoir avec responsabilité. Toutes vos actions peuvent affecter tous les utilisateurs.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-blue-400" />
              Gestion des Accès
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-white/60">
              Pour ajouter ou retirer des super admins, utilisez directement la base de données :
            </p>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3 font-mono text-xs text-white/80">
              <p>INSERT INTO super_admins (user_id, created_by)</p>
              <p className="mt-1">VALUES ('user-id', 'your-id');</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-400" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Recommandations de Sécurité</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-white/60 ml-4">
                <li>Limitez le nombre de super admins au strict minimum</li>
                <li>Surveillez régulièrement les actions effectuées</li>
                <li>Utilisez des mots de passe forts et la 2FA</li>
                <li>Auditez régulièrement les accès super admin</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




