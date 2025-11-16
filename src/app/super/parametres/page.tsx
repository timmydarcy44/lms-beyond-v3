import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User, Mail } from "lucide-react";
import { StripeConnectButton } from "@/components/super-admin/stripe-connect-button";

export default async function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header centré avec gradient */}
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Paramètres Super Admin
        </h1>
        <p className="text-sm text-gray-600 text-center">
          Configuration et gestion de l'accès super admin
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-900" />
              Accès Super Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-900">
                En tant que Super Admin, vous avez accès complet à toutes les données du système.
              </p>
              <p className="mt-2 text-xs text-gray-600">
                Utilisez ce pouvoir avec responsabilité. Toutes vos actions peuvent affecter tous les utilisateurs.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-900" />
              Gestion des Accès
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Pour ajouter ou retirer des super admins, utilisez directement la base de données :
            </p>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-800">
              <p>INSERT INTO super_admins (user_id, created_by)</p>
              <p className="mt-1">VALUES ('user-id', 'your-id');</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm">
          <CardContent className="pt-6">
            <StripeConnectButton />
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-white shadow-sm md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-900" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-900">Recommandations de Sécurité</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
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

