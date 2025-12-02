"use client";

import { useState, useEffect } from "react";
import { Briefcase, Award, ClipboardCheck, ArrowRight, TrendingUp, BookOpen, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";

type WelcomePageContentProps = {
  userId: string;
};

type JobOffer = {
  id: string;
  title: string;
  description: string;
  contract_type: string;
  location?: string;
  remote_allowed: boolean;
  company: {
    id: string;
    name: string;
    logo_url?: string;
  } | null | undefined;
  beyond_connect_companies?: Array<{
    id: string;
    name: string;
    logo_url?: string;
  }> | null;
  created_at: string;
  match_score?: number;
};

export function WelcomePageContent({ userId }: WelcomePageContentProps) {
  const [recentJobOffers, setRecentJobOffers] = useState<JobOffer[]>([]);
  const [matchedJobOffers, setMatchedJobOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSoftSkillsCompleted, setIsSoftSkillsCompleted] = useState(false);

  useEffect(() => {
    loadJobOffers();
    checkSoftSkillsStatus();
  }, [userId]);

  const normalizeJobOffer = (offer: any): JobOffer => {
    let company = offer.company;
    if (!company && offer.beyond_connect_companies && Array.isArray(offer.beyond_connect_companies) && offer.beyond_connect_companies.length > 0) {
      company = offer.beyond_connect_companies[0];
    }
    
    return {
      ...offer,
      company: company || { id: "", name: "Entreprise non spécifiée", logo_url: undefined },
    };
  };

  const loadJobOffers = async () => {
    try {
      const recentResponse = await fetch("/api/beyond-connect/job-offers/public?limit=6&sort=created_at");
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        const normalizedOffers = (recentData.jobOffers || []).map(normalizeJobOffer);
        setRecentJobOffers(normalizedOffers);
      }

      const matchedResponse = await fetch("/api/beyond-connect/job-offers/matched");
      if (matchedResponse.ok) {
        const matchedData = await matchedResponse.json();
        const normalizedMatched = (matchedData.jobOffers || []).map(normalizeJobOffer);
        setMatchedJobOffers(normalizedMatched);
      }
    } catch (error) {
      console.error("[welcome] Error loading job offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkSoftSkillsStatus = async () => {
    try {
      const response = await fetch("/api/beyond-connect/beyond-noschool-tests");
      if (response.ok) {
        const data = await response.json();
        const softSkillsTest = (data.tests || []).find((test: any) => 
          test.title?.toLowerCase().includes("soft skills") || 
          test.title === "Soft Skills – Profil 360"
        );
        if (softSkillsTest && softSkillsTest.is_completed) {
          setIsSoftSkillsCompleted(true);
        }
      }
    } catch (error) {
      console.error("[welcome] Error checking soft skills status:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Style Apple */}
      <section className="relative overflow-hidden bg-white pt-24 pb-32">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h1 className="mb-6 text-6xl font-semibold tracking-tight text-gray-900 md:text-7xl">
            Bienvenue sur<br />Beyond Connect
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-2xl text-gray-600">
            Votre profil est créé. Découvrez les opportunités qui vous correspondent.
          </p>
        </div>
      </section>

      {/* Section Soft Skills - Style Apple Hero - Affichée uniquement si non complété */}
      {!isSoftSkillsCompleted && (
        <section className="relative bg-white py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-16 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="mb-4 text-5xl font-semibold tracking-tight text-gray-900">
                  Test Soft Skills
                </h2>
                <p className="mb-6 text-2xl text-gray-600">
                  Boostez votre matching de <span className="font-semibold text-green-600">40%</span>
                </p>
                <p className="mb-8 text-lg leading-relaxed text-gray-500">
                  Les recruteurs sont particulièrement attentifs aux profils ayant complété le test Soft Skills. 
                  Il permet d'augmenter significativement votre score de matching et de vous démarquer des autres candidats.
                </p>
                <div className="mb-8 space-y-3 text-gray-600">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-green-600">✓</span>
                    <span>Augmente votre visibilité auprès des recruteurs</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-green-600">✓</span>
                    <span>Améliore votre score de matching automatique</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-green-600">✓</span>
                    <span>Valide vos compétences comportementales</span>
                  </div>
                </div>
                <Link href="/dashboard/apprenant/questionnaires">
                  <Button className="h-12 rounded-full bg-[#003087] px-8 text-lg font-medium text-white transition-all hover:bg-[#002a6b] hover:shadow-lg">
                    Passer le test
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-gray-100">
                <Image
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
                  alt="Test Soft Skills"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section Open Badges - Style Apple Hero */}
      <section className="relative bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-16 md:grid-cols-2 md:items-center">
            <div className="order-2 md:order-1 relative aspect-[4/3] overflow-hidden rounded-3xl bg-gray-100">
              <Image
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200&auto=format&fit=crop"
                alt="Open Badges"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="mb-4 text-5xl font-semibold tracking-tight text-gray-900">
                Open Badges
              </h2>
              <p className="mb-6 text-2xl text-gray-600">
                Profils <span className="font-semibold text-yellow-600">3x plus consultés</span> par les recruteurs
              </p>
              <p className="mb-8 text-lg leading-relaxed text-gray-500">
                Les profils avec Open Badges attirent l'attention des recruteurs et démontrent votre engagement 
                dans le développement de vos compétences. Partagez-les sur LinkedIn pour maximiser votre visibilité.
              </p>
              <div className="mb-8 space-y-3 text-gray-600">
                <div className="flex items-start gap-3">
                  <span className="mt-1 text-yellow-600">✓</span>
                  <span>Certifie vos compétences de manière vérifiable</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 text-yellow-600">✓</span>
                  <span>Partageable sur LinkedIn et autres réseaux</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 text-yellow-600">✓</span>
                  <span>Augmente votre crédibilité professionnelle</span>
                </div>
              </div>
              <Link href="/beyond-connect-app/profile">
                <Button className="h-12 rounded-full bg-[#003087] px-8 text-lg font-medium text-white transition-all hover:bg-[#002a6b] hover:shadow-lg">
                  Découvrir mes badges
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section Offres Correspondantes - Style Apple Grid */}
      {matchedJobOffers.length > 0 && (
        <section className="bg-white py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-5xl font-semibold tracking-tight text-gray-900">
                Offres qui vous correspondent
              </h2>
              <p className="text-xl text-gray-600">
                Basé sur votre profil, vos compétences et vos soft skills
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {matchedJobOffers.slice(0, 6).map((offer) => (
                <Link key={offer.id} href={`/beyond-connect-app/jobs/${offer.id}`}>
                  <Card className="group h-full cursor-pointer overflow-hidden border-0 bg-white shadow-sm transition-all hover:shadow-xl">
                    <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                      <Image
                        src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=800&auto=format&fit=crop"
                        alt={offer.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {offer.match_score && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-green-600 text-white shadow-lg">
                            {offer.match_score}% match
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="mb-2 text-xl font-semibold text-gray-900">{offer.title}</h3>
                      <p className="mb-3 text-sm text-gray-500">{offer.company?.name || "Entreprise non spécifiée"}</p>
                      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-600">{offer.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {offer.location && <span>📍 {offer.location}</span>}
                        {offer.remote_allowed && <span>• Télétravail</span>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link href="/beyond-connect-app/jobs">
                <Button variant="outline" className="h-12 rounded-full border-gray-300 px-8 text-lg font-medium text-gray-900 transition-all hover:bg-gray-50 hover:shadow-md">
                  Voir toutes les offres
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Section Dernières Offres - Style Apple Grid */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-5xl font-semibold tracking-tight text-gray-900">
              Dernières offres publiées
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez les nouvelles opportunités disponibles
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {recentJobOffers.map((offer) => (
              <Link key={offer.id} href={`/beyond-connect-app/jobs/${offer.id}`}>
                <Card className="group h-full cursor-pointer overflow-hidden border-0 bg-white shadow-sm transition-all hover:shadow-xl">
                  <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                    <Image
                      src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop"
                      alt={offer.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">{offer.title}</h3>
                    <p className="mb-3 text-sm text-gray-500">{offer.company?.name || "Entreprise non spécifiée"}</p>
                    <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-600">{offer.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {offer.location && <span>📍 {offer.location}</span>}
                      {offer.remote_allowed && <span>• Télétravail</span>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section Formations - Style Apple Hero */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-16 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="mb-4 text-5xl font-semibold tracking-tight text-gray-900">
                Formations Beyond No School
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-gray-500">
                Accédez à des formations de qualité pour développer vos compétences professionnelles. 
                Formez-vous à votre rythme et obtenez des certifications reconnues qui enrichiront votre profil.
              </p>
              <Link href="/beyond-connect-app">
                <Button className="h-12 rounded-full bg-[#003087] px-8 text-lg font-medium text-white transition-all hover:bg-[#002a6b] hover:shadow-lg">
                  Découvrir les formations
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-gray-100">
              <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
                alt="Formations"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Actions Rapides - Style Apple Footer */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-16 text-center text-5xl font-semibold tracking-tight text-gray-900">
            Actions rapides
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Link href="/beyond-connect-app/jobs">
              <Card className="group h-full cursor-pointer border-0 bg-white p-8 text-center shadow-sm transition-all hover:shadow-xl">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 transition-all group-hover:bg-[#003087] group-hover:text-white">
                    <Briefcase className="h-10 w-10 text-gray-600 transition-colors group-hover:text-white" />
                  </div>
                </div>
                <h3 className="mb-3 text-2xl font-semibold text-gray-900">Voir les annonces</h3>
                <p className="text-gray-500">Découvrez toutes les opportunités disponibles</p>
              </Card>
            </Link>
            <Link href="/beyond-connect-app/profile">
              <Card className="group h-full cursor-pointer border-0 bg-white p-8 text-center shadow-sm transition-all hover:shadow-xl">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 transition-all group-hover:bg-[#003087] group-hover:text-white">
                    <Users className="h-10 w-10 text-gray-600 transition-colors group-hover:text-white" />
                  </div>
                </div>
                <h3 className="mb-3 text-2xl font-semibold text-gray-900">Modifier mon profil</h3>
                <p className="text-gray-500">Complétez et optimisez votre profil</p>
              </Card>
            </Link>
            <Link href="/beyond-connect-app">
              <Card className="group h-full cursor-pointer border-0 bg-white p-8 text-center shadow-sm transition-all hover:shadow-xl">
                <div className="mb-6 flex justify-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 transition-all group-hover:bg-[#003087] group-hover:text-white">
                    <TrendingUp className="h-10 w-10 text-gray-600 transition-colors group-hover:text-white" />
                  </div>
                </div>
                <h3 className="mb-3 text-2xl font-semibold text-gray-900">Mon tableau de bord</h3>
                <p className="text-gray-500">Accédez à votre espace personnel</p>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
