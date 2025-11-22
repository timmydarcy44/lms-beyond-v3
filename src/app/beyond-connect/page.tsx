import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, Search, TrendingUp, Shield, Zap, Target, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const metadata: Metadata = {
  title: "Beyond Connect - Plateforme de recrutement et CV numérique",
  description: "Trouvez les meilleurs talents et connectez-vous avec les jeunes professionnels. Beyond Connect est la plateforme de recrutement nouvelle génération.",
};

export default function BeyondConnectLandingPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const hasError = searchParams?.error === "access_denied";
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#003087] text-white font-bold text-lg">
                BC
              </div>
              <span className="text-2xl font-bold text-gray-900">Beyond Connect</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/beyond-connect/login">
                <Button variant="ghost" className="text-gray-700 hover:bg-gray-100">
                  Connexion
                </Button>
              </Link>
              <Link href="/beyond-connect/contact">
                <Button className="bg-[#003087] hover:bg-[#002a7a] text-white">
                  Nous contacter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {hasError && (
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Accès réservé</AlertTitle>
            <AlertDescription className="text-blue-800">
              Beyond Connect est actuellement réservé aux apprenants de Beyond No School. 
              Si vous êtes une entreprise intéressée par nos services, veuillez nous contacter via le formulaire ci-dessous.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#003087] via-[#003087] to-[#002a7a] text-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h1 className="mb-6 text-5xl font-bold leading-tight">
              Trouvez les meilleurs talents
              <br />
              <span className="text-blue-200">de la nouvelle génération</span>
            </h1>
            <p className="mb-8 text-xl text-blue-100 max-w-2xl mx-auto">
              Beyond Connect est la plateforme de recrutement qui connecte les entreprises aux jeunes professionnels. 
              Accédez à un vivier de talents qualifiés avec des profils complets, des compétences vérifiées et un système de matching intelligent.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/beyond-connect/demo">
                <Button size="lg" className="bg-white text-[#003087] hover:bg-gray-100 text-lg px-8">
                  Demander une démo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/beyond-connect/features">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8">
                  Découvrir les fonctionnalités
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              Pourquoi choisir Beyond Connect ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Une plateforme complète pour recruter efficacement et trouver les profils qui correspondent à vos besoins.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#003087]/10">
                  <Search className="h-6 w-6 text-[#003087]" />
                </div>
                <CardTitle className="text-gray-900">Recherche avancée</CardTitle>
                <CardDescription>
                  Filtrez les candidats par compétences, localisation, expérience et bien plus encore.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#003087]/10">
                  <TrendingUp className="h-6 w-6 text-[#003087]" />
                </div>
                <CardTitle className="text-gray-900">Matching intelligent</CardTitle>
                <CardDescription>
                  Notre algorithme calcule automatiquement la correspondance entre vos offres et les profils candidats.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#003087]/10">
                  <Users className="h-6 w-6 text-[#003087]" />
                </div>
                <CardTitle className="text-gray-900">Profils complets</CardTitle>
                <CardDescription>
                  Accédez à des CV numériques détaillés avec expériences, compétences, certifications et badges.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#003087]/10">
                  <Briefcase className="h-6 w-6 text-[#003087]" />
                </div>
                <CardTitle className="text-gray-900">Gestion des offres</CardTitle>
                <CardDescription>
                  Publiez et gérez vos offres d'emploi, stages et alternances en quelques clics.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#003087]/10">
                  <Shield className="h-6 w-6 text-[#003087]" />
                </div>
                <CardTitle className="text-gray-900">Données vérifiées</CardTitle>
                <CardDescription>
                  Les compétences et certifications sont vérifiées grâce à l'intégration avec Beyond No School.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#003087]/10">
                  <Zap className="h-6 w-6 text-[#003087]" />
                </div>
                <CardTitle className="text-gray-900">Interface moderne</CardTitle>
                <CardDescription>
                  Une expérience utilisateur intuitive et moderne pour gérer vos recrutements efficacement.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">
              Comment ça fonctionne ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              En quelques étapes simples, trouvez les candidats idéaux pour votre entreprise.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#003087] text-white text-2xl font-bold mx-auto">
                1
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">Créez votre entreprise</h3>
              <p className="text-gray-600">
                Inscrivez-vous et créez le profil de votre entreprise en quelques minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#003087] text-white text-2xl font-bold mx-auto">
                2
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">Publiez vos offres</h3>
              <p className="text-gray-600">
                Créez et publiez vos offres d'emploi avec l'aide de l'IA pour optimiser vos descriptions.
              </p>
            </div>

            <div className="text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#003087] text-white text-2xl font-bold mx-auto">
                3
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">Trouvez les talents</h3>
              <p className="text-gray-600">
                Utilisez notre système de matching pour trouver les candidats qui correspondent à vos critères.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#003087] py-20 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-6 text-4xl font-bold">
            Prêt à trouver vos prochains talents ?
          </h2>
          <p className="mb-8 text-xl text-blue-100">
            Rejoignez les entreprises qui font confiance à Beyond Connect pour leurs recrutements.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/beyond-connect/demo">
              <Button size="lg" className="bg-white text-[#003087] hover:bg-gray-100 text-lg px-8">
                Demander une démo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/beyond-connect/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#003087] text-white font-bold">
                  BC
                </div>
                <span className="text-xl font-bold text-gray-900">Beyond Connect</span>
              </div>
              <p className="text-sm text-gray-600">
                La plateforme de recrutement nouvelle génération.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-gray-900">Produit</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/beyond-connect/features" className="hover:text-[#003087]">Fonctionnalités</Link></li>
                <li><Link href="/beyond-connect/pricing" className="hover:text-[#003087]">Tarifs</Link></li>
                <li><Link href="/beyond-connect/demo" className="hover:text-[#003087]">Démo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-gray-900">Entreprise</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/beyond-connect/about" className="hover:text-[#003087]">À propos</Link></li>
                <li><Link href="/beyond-connect/contact" className="hover:text-[#003087]">Contact</Link></li>
                <li><Link href="/beyond-connect/blog" className="hover:text-[#003087]">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-gray-900">Légal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/beyond-connect/privacy" className="hover:text-[#003087]">Confidentialité</Link></li>
                <li><Link href="/beyond-connect/terms" className="hover:text-[#003087]">CGU</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
            <p>&copy; {new Date().getFullYear()} Beyond Connect. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

