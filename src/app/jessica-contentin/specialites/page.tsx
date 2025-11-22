import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Heart, Users, BookOpen, Shield, Target, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

const specialites = [
  {
    id: "confiance-en-soi",
    title: "Gestion de la confiance en soi",
    icon: Heart,
    description: "Renforcement de l'estime de soi et développement de la confiance personnelle.",
  },
  {
    id: "gestion-stress",
    title: "Gestion du stress",
    icon: Brain,
    description: "Techniques et stratégies pour mieux gérer le stress au quotidien.",
  },
  {
    id: "tnd",
    title: "Accompagnement TND",
    icon: Users,
    description: "Accompagnement spécialisé pour les troubles du neurodéveloppement (DYS, TDA-H).",
  },
  {
    id: "guidance-parentale",
    title: "Guidance parentale",
    icon: Heart,
    description: "Soutien et conseils pour les parents dans leur rôle éducatif.",
  },
  {
    id: "tests",
    title: "Tests de connaissance de soi",
    icon: BookOpen,
    description: "Évaluations et bilans pour mieux se connaître et identifier ses forces.",
  },
  {
    id: "harcelement",
    title: "Harcèlement Scolaire",
    icon: Shield,
    description: "Accompagnement et soutien face au harcèlement scolaire.",
  },
  {
    id: "orientation",
    title: "Orientation scolaire",
    icon: Target,
    description: "Aide à l'orientation et au choix de parcours scolaire et professionnel.",
  },
  {
    id: "therapie",
    title: "Thérapie psycho-émotionnelle",
    icon: Lightbulb,
    description: "Accompagnement thérapeutique pour la gestion des émotions.",
  },
];

export default function SpecialitesPage() {
  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h1
              className="text-5xl font-bold text-[#2F2A25] mb-6"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Spécialités
            </h1>
            <p
              className="text-xl text-[#2F2A25]/80 max-w-3xl mx-auto"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Un accompagnement personnalisé adapté à chaque besoin spécifique.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {specialites.map((specialite) => {
              const Icon = specialite.icon;
              return (
                <Link key={specialite.id} href={`/specialites/${specialite.id}`}>
                  <Card className="border-[#E6D9C6] bg-white hover:shadow-lg transition-all hover:border-[#C6A664] cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[#E6D9C6]/30 rounded-lg">
                          <Icon className="h-6 w-6 text-[#C6A664]" />
                        </div>
                        <CardTitle
                          className="text-lg font-semibold text-[#2F2A25]"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                          }}
                        >
                          {specialite.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p
                        className="text-[#2F2A25]/80 text-sm"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                        }}
                      >
                        {specialite.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="text-center">
            <Button
              asChild
              size="lg"
              className="bg-[#C6A664] hover:bg-[#B88A44] text-white rounded-full px-8 py-6 text-lg"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Prendre rendez-vous
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

