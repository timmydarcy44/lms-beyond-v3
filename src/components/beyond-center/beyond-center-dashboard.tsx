"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GraduationCap, 
  Award, 
  FileCheck, 
  BookOpen,
  Briefcase,
  Heart,
  Network,
  TrendingUp,
  Target,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function BeyondCenterDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Couleurs Beyond Center - Noir et blanc, haut de gamme
  const primaryColor = "#000000";
  const secondaryColor = "#1A1A1A";
  const accentColor = "#FFFFFF";
  const bgColor = "#FFFFFF";
  const surfaceColor = "#FAFAFA";
  const textColor = "#000000";

  return (
    <div className="min-h-screen" style={{ backgroundColor: surfaceColor }}>
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-lg border-2"
                style={{ 
                  backgroundColor: primaryColor,
                  color: accentColor,
                  borderColor: primaryColor
                }}
              >
                BC
              </div>
              <span className="text-2xl font-bold tracking-tight" style={{ color: textColor }}>
                Beyond Center
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/beyond-center-app/mon-compte">
                <Button variant="ghost" style={{ color: textColor }}>
                  Mon compte
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero Section */}
        <div 
          className="rounded-2xl p-8 mb-8 relative overflow-hidden"
          style={{ backgroundColor: primaryColor }}
        >
          {/* Pattern subtil */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}></div>
          </div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-2 tracking-tight" style={{ color: accentColor }}>
              Bienvenue sur Beyond Center
            </h1>
            <p className="text-gray-300 text-lg font-light">
              Développez vos compétences, certifiez votre expertise et optimisez votre insertion professionnelle.
            </p>
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Link href="/beyond-center-app/formations">
            <Card className="hover:shadow-xl hover:border-black transition-all duration-300 cursor-pointer border border-gray-200 bg-white">
              <CardHeader>
                <div 
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border-2"
                  style={{ 
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    color: accentColor
                  }}
                >
                  <GraduationCap className="h-6 w-6" />
                </div>
                <CardTitle className="font-semibold" style={{ color: textColor }}>Mes formations</CardTitle>
                <CardDescription className="font-light">
                  Accédez à vos formations en cours et disponibles
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/beyond-center-app/certifications">
            <Card className="hover:shadow-xl hover:border-black transition-all duration-300 cursor-pointer border border-gray-200 bg-white">
              <CardHeader>
                <div 
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border-2"
                  style={{ 
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    color: accentColor
                  }}
                >
                  <Award className="h-6 w-6" />
                </div>
                <CardTitle className="font-semibold" style={{ color: textColor }}>Mes certifications</CardTitle>
                <CardDescription className="font-light">
                  Consultez vos Open Badge et titres professionnels
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard/apprenant/beyond-care">
            <Card className="hover:shadow-xl hover:border-black transition-all duration-300 cursor-pointer border border-gray-200 bg-white">
              <CardHeader>
                <div 
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border-2"
                  style={{ 
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    color: accentColor
                  }}
                >
                  <Heart className="h-6 w-6" />
                </div>
                <CardTitle className="font-semibold" style={{ color: textColor }}>Beyond Care</CardTitle>
                <CardDescription className="font-light">
                  Accompagnement psychopédagogique
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/beyond-connect-app">
            <Card className="hover:shadow-xl hover:border-black transition-all duration-300 cursor-pointer border border-gray-200 bg-white">
              <CardHeader>
                <div 
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border-2"
                  style={{ 
                    backgroundColor: primaryColor,
                    borderColor: primaryColor,
                    color: accentColor
                  }}
                >
                  <Network className="h-6 w-6" />
                </div>
                <CardTitle className="font-semibold" style={{ color: textColor }}>Beyond Connect</CardTitle>
                <CardDescription className="font-light">
                  Optimisez votre recherche d'emploi
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger 
              value="overview"
              className="data-[state=active]:bg-black data-[state=active]:text-white rounded-md transition-all duration-300 font-medium"
              style={{ 
                color: activeTab === "overview" ? accentColor : textColor 
              }}
            >
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger 
              value="formations"
              className="data-[state=active]:bg-black data-[state=active]:text-white rounded-md transition-all duration-300 font-medium"
              style={{ 
                color: activeTab === "formations" ? accentColor : textColor 
              }}
            >
              Formations
            </TabsTrigger>
            <TabsTrigger 
              value="certifications"
              className="data-[state=active]:bg-black data-[state=active]:text-white rounded-md transition-all duration-300 font-medium"
              style={{ 
                color: activeTab === "certifications" ? accentColor : textColor 
              }}
            >
              Certifications
            </TabsTrigger>
            <TabsTrigger 
              value="ecosysteme"
              className="data-[state=active]:bg-black data-[state=active]:text-white rounded-md transition-all duration-300 font-medium"
              style={{ 
                color: activeTab === "ecosysteme" ? accentColor : textColor 
              }}
            >
              Écosystème
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle style={{ color: textColor }}>Mes compétences</CardTitle>
                  <CardDescription>
                    Suivez l'évolution de vos compétences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: textColor }}>Compétences acquises</span>
                      <span className="font-semibold" style={{ color: primaryColor }}>0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: textColor }}>En cours d'acquisition</span>
                      <span className="font-semibold" style={{ color: primaryColor }}>0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle style={{ color: textColor }}>Prochaines étapes</CardTitle>
                  <CardDescription>
                    Continuez votre parcours de développement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: surfaceColor }}>
                      <Target className="h-5 w-5" style={{ color: primaryColor }} />
                      <span className="text-sm" style={{ color: textColor }}>
                        Commencez votre première formation
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: surfaceColor }}>
                      <Award className="h-5 w-5" style={{ color: primaryColor }} />
                      <span className="text-sm" style={{ color: textColor }}>
                        Obtenez votre premier Open Badge
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="formations" className="mt-6">
            <Card className="border-gray-200 bg-white">
              <CardHeader>
                <CardTitle style={{ color: textColor }}>Mes formations</CardTitle>
                <CardDescription>
                  Accédez à toutes vos formations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 mx-auto mb-4" style={{ color: primaryColor, opacity: 0.5 }} />
                  <p className="text-gray-600 mb-4">Aucune formation pour le moment</p>
                  <Link href="/dashboard/catalogue">
                    <Button 
                      className="font-medium transition-all duration-300"
                      style={{ backgroundColor: primaryColor, color: accentColor }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = secondaryColor;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = primaryColor;
                      }}
                    >
                      Découvrir les formations
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle style={{ color: textColor }}>Open Badge</CardTitle>
                  <CardDescription>
                    Badges numériques de compétences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Award className="h-10 w-10 mx-auto mb-4" style={{ color: primaryColor, opacity: 0.5 }} />
                    <p className="text-sm text-gray-600">Aucun Open Badge obtenu</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle style={{ color: textColor }}>Titres professionnels</CardTitle>
                  <CardDescription>
                    Certifications ministère du travail
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileCheck className="h-10 w-10 mx-auto mb-4" style={{ color: primaryColor, opacity: 0.5 }} />
                    <p className="text-sm text-gray-600">Aucun titre professionnel obtenu</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ecosysteme" className="mt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Link href="/dashboard/apprenant/beyond-care">
                <Card className="hover:shadow-xl hover:border-black transition-all duration-300 cursor-pointer border border-gray-200 bg-white">
                  <CardHeader>
                    <div 
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border-2"
                      style={{ 
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                        color: accentColor
                      }}
                    >
                      <Heart className="h-6 w-6" />
                    </div>
                    <CardTitle className="font-semibold" style={{ color: textColor }}>Beyond Care</CardTitle>
                    <CardDescription className="font-light">
                      Accompagnement psychopédagogique pour optimiser votre apprentissage
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/dashboard/catalogue">
                <Card className="hover:shadow-xl hover:border-black transition-all duration-300 cursor-pointer border border-gray-200 bg-white">
                  <CardHeader>
                    <div 
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border-2"
                      style={{ 
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                        color: accentColor
                      }}
                    >
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <CardTitle className="font-semibold" style={{ color: textColor }}>Beyond No School</CardTitle>
                    <CardDescription className="font-light">
                      Catalogue complet de formations, modules et ressources pédagogiques
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>

              <Link href="/beyond-connect-app">
                <Card className="hover:shadow-xl hover:border-black transition-all duration-300 cursor-pointer border border-gray-200 bg-white">
                  <CardHeader>
                    <div 
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border-2"
                      style={{ 
                        backgroundColor: primaryColor,
                        borderColor: primaryColor,
                        color: accentColor
                      }}
                    >
                      <Network className="h-6 w-6" />
                    </div>
                    <CardTitle className="font-semibold" style={{ color: textColor }}>Beyond Connect</CardTitle>
                    <CardDescription className="font-light">
                      CV numérique, offres d'emploi (stage, CDI, alternance, CDD)
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

