import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Euro, Users, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

export default function ConsultationsPage() {
  const consultations = [
    {
      title: "Première consultation | Parentalité",
      price: "90,00 €",
      description: "Consultation initiale pour les parents souhaitant un accompagnement dans leur rôle parental.",
    },
    {
      title: "Consultation de suivi | Parentalité",
      price: "70,00 €",
      description: "Séances de suivi pour continuer l'accompagnement parental.",
    },
    {
      title: "Consultation étudiant",
      price: "70,00 €",
      description: "Accompagnement personnalisé pour les étudiants dans leur parcours académique.",
    },
    {
      title: "Première consultation | Enfant",
      price: "90,00 €",
      description: "Première séance pour les enfants nécessitant un accompagnement psychopédagogique.",
    },
    {
      title: "Consultation de suivi | Enfant",
      price: "70,00 €",
      description: "Séances de suivi pour les enfants en cours d'accompagnement.",
    },
    {
      title: "Première consultation | Adolescent",
      price: "90,00 €",
      description: "Consultation initiale pour les adolescents.",
    },
    {
      title: "Consultation de suivi | Adolescent",
      price: "70,00 €",
      description: "Séances de suivi pour les adolescents.",
    },
    {
      title: "Première consultation | Adulte",
      price: "90,00 €",
      description: "Première consultation pour les adultes.",
    },
    {
      title: "Consultation de suivi | Adulte",
      price: "70,00 €",
      description: "Séances de suivi pour les adultes.",
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
              Consultations
            </h1>
            <p
              className="text-xl text-[#2F2A25]/80 max-w-3xl mx-auto"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              Des consultations personnalisées adaptées à chaque profil et à chaque besoin.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {consultations.map((consultation, index) => (
              <Card key={index} className="border-[#E6D9C6] bg-white hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle
                    className="text-lg font-semibold text-[#2F2A25]"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    {consultation.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Euro className="h-5 w-5 text-[#C6A664]" />
                    <span
                      className="text-2xl font-bold text-[#2F2A25]"
                      style={{
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      }}
                    >
                      {consultation.price}
                    </span>
                  </div>
                  <p
                    className="text-[#2F2A25]/80 mb-4"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    {consultation.description}
                  </p>
                </CardContent>
              </Card>
            ))}
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

          <div className="mt-16 bg-[#E6D9C6]/30 rounded-2xl p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <Clock className="h-8 w-8 text-[#C6A664] mx-auto mb-4" />
                  <h3
                  className="font-semibold text-[#2F2A25] mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Durée des séances
                </h3>
                <p
                  className="text-[#2F2A25]/80 text-sm"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Entre 45 minutes et 1 heure selon le type de consultation
                </p>
              </div>
              <div className="text-center">
                <Users className="h-8 w-8 text-[#C6A664] mx-auto mb-4" />
                  <h3
                  className="font-semibold text-[#2F2A25] mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Public concerné
                </h3>
                <p
                  className="text-[#2F2A25]/80 text-sm"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Enfants, adolescents, adultes et parents
                </p>
              </div>
              <div className="text-center">
                <Heart className="h-8 w-8 text-[#C6A664] mx-auto mb-4" />
                  <h3
                  className="font-semibold text-[#2F2A25] mb-2"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Approche bienveillante
                </h3>
                <p
                  className="text-[#2F2A25]/80 text-sm"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Accompagnement personnalisé et adapté à chaque situation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

