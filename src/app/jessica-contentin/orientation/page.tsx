import { Button } from "@/components/ui/button";
import { ArrowRight, Target, BookOpen, Lightbulb, Users, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

export default function OrientationPage() {
  const services = [
    {
      icon: Target,
      title: "Bilan d'orientation personnalisé",
      description: "Évaluation approfondie de vos intérêts, compétences et aspirations pour identifier les parcours qui vous correspondent.",
    },
    {
      icon: BookOpen,
      title: "Exploration des métiers",
      description: "Découverte des différents secteurs d'activité et des métiers en lien avec votre profil.",
    },
    {
      icon: Lightbulb,
      title: "Identification des compétences",
      description: "Mise en lumière de vos forces, talents et compétences pour orienter vos choix.",
    },
    {
      icon: Users,
      title: "Accompagnement dans les démarches",
      description: "Soutien dans la recherche de formations, la préparation des dossiers et les entretiens.",
    },
  ];

  const etapes = [
    {
      step: "1",
      title: "Premier rendez-vous",
      description: "Échange pour comprendre vos besoins, vos questionnements et vos objectifs.",
    },
    {
      step: "2",
      title: "Bilan approfondi",
      description: "Évaluation de vos intérêts, compétences, valeurs et personnalité.",
    },
    {
      step: "3",
      title: "Exploration des pistes",
      description: "Recherche et analyse des formations et métiers correspondant à votre profil.",
    },
    {
      step: "4",
      title: "Recommandations",
      description: "Présentation des parcours recommandés avec un plan d'action personnalisé.",
    },
  ];

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
              Orientation scolaire et professionnelle
            </h1>
            <p
              className="text-xl text-[#2F2A25]/80 max-w-3xl mx-auto"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Un accompagnement personnalisé pour vous aider à faire les bons choix et à révéler votre potentiel.
            </p>
          </div>

          {/* Services */}
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="border-[#E6D9C6] bg-white">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-[#E6D9C6]/30 rounded-lg">
                        <Icon className="h-6 w-6 text-[#C6A664]" />
                      </div>
                      <CardTitle
                        className="text-xl font-semibold text-[#2F2A25]"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                        }}
                      >
                        {service.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p
                      className="text-[#2F2A25]/80"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      }}
                    >
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Étapes */}
          <div className="mb-16">
            <h2
              className="text-3xl font-bold text-[#2F2A25] mb-8 text-center"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Comment se déroule l'accompagnement ?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {etapes.map((etape) => (
                <div key={etape.step} className="relative">
                  <div className="bg-[#E6D9C6]/30 rounded-2xl p-6 h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C6A664] text-white font-bold">
                        {etape.step}
                      </div>
                      <h3
                        className="text-lg font-semibold text-[#2F2A25]"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                        }}
                      >
                        {etape.title}
                      </h3>
                    </div>
                    <p
                      className="text-[#2F2A25]/80 text-sm"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      }}
                    >
                      {etape.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center bg-gradient-to-br from-[#E6D9C6]/30 to-[#F8F5F0] rounded-3xl p-12">
            <CheckCircle className="h-16 w-16 text-[#C6A664] mx-auto mb-6" />
              <h2
              className="text-3xl font-bold text-[#2F2A25] mb-4"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Prêt à trouver votre voie ?
            </h2>
            <p
              className="text-lg text-[#2F2A25]/80 mb-8 max-w-2xl mx-auto"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Prenez rendez-vous pour un premier échange et découvrez comment je peux vous accompagner dans votre orientation.
            </p>
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

