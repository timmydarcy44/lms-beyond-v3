import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

const specialitesContent: Record<string, { title: string; description: string; details: string[] }> = {
  "confiance-en-soi": {
    title: "Gestion de la confiance en soi",
    description: "Renforcement de l'estime de soi et développement de la confiance personnelle.",
    details: [
      "Identification des forces et des talents personnels",
      "Techniques de renforcement de l'estime de soi",
      "Gestion des pensées négatives et des doutes",
      "Développement de l'assertivité",
      "Valorisation des réussites et des progrès",
    ],
  },
  "gestion-stress": {
    title: "Gestion du stress",
    description: "Techniques et stratégies pour mieux gérer le stress au quotidien.",
    details: [
      "Identification des sources de stress",
      "Techniques de relaxation et de respiration",
      "Gestion du temps et des priorités",
      "Stratégies d'adaptation et de coping",
      "Prévention du burn-out et de l'épuisement",
    ],
  },
  "tnd": {
    title: "Accompagnement TND",
    description: "Accompagnement spécialisé pour les troubles du neurodéveloppement (DYS, TDA-H).",
    details: [
      "Bilan et évaluation des besoins spécifiques",
      "Stratégies d'apprentissage adaptées",
      "Accompagnement à l'inclusion scolaire",
      "Soutien aux familles",
      "Collaboration avec les équipes éducatives",
    ],
  },
  "guidance-parentale": {
    title: "Guidance parentale",
    description: "Soutien et conseils pour les parents dans leur rôle éducatif.",
    details: [
      "Écoute et conseils personnalisés",
      "Stratégies éducatives adaptées",
      "Gestion des conflits familiaux",
      "Soutien dans les difficultés scolaires",
      "Renforcement du lien parent-enfant",
    ],
  },
  "tests": {
    title: "Tests de connaissance de soi",
    description: "Évaluations et bilans pour mieux se connaître et identifier ses forces.",
    details: [
      "Bilans psychopédagogiques",
      "Évaluation des compétences",
      "Identification des forces et faiblesses",
      "Tests de personnalité adaptés",
      "Recommandations personnalisées",
    ],
  },
  "harcelement": {
    title: "Harcèlement Scolaire",
    description: "Accompagnement et soutien face au harcèlement scolaire.",
    details: [
      "Écoute et soutien psychologique",
      "Stratégies de protection et de défense",
      "Travail sur la confiance en soi",
      "Collaboration avec l'école",
      "Soutien aux familles",
    ],
  },
  "orientation": {
    title: "Orientation scolaire",
    description: "Aide à l'orientation et au choix de parcours scolaire et professionnel.",
    details: [
      "Bilan d'orientation personnalisé",
      "Identification des intérêts et compétences",
      "Exploration des métiers et formations",
      "Aide à la décision",
      "Accompagnement dans les démarches",
    ],
  },
  "therapie": {
    title: "Thérapie psycho-émotionnelle",
    description: "Accompagnement thérapeutique pour la gestion des émotions.",
    details: [
      "Identification et compréhension des émotions",
      "Techniques de régulation émotionnelle",
      "Gestion de l'anxiété et des peurs",
      "Travail sur les traumatismes",
      "Développement de la résilience",
    ],
  },
};

export default async function SpecialiteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const content = specialitesContent[slug];

  if (!content) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="space-y-8">
            <div>
              <h1
                className="text-5xl font-bold text-[#2F2A25] mb-6"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                {content.title}
              </h1>
              <p
                className="text-xl text-[#2F2A25]/80"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                {content.description}
              </p>
            </div>

            <div className="bg-[#E6D9C6]/30 rounded-2xl p-8">
              <h2
                className="text-2xl font-bold text-[#2F2A25] mb-6"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Ce que je propose
              </h2>
              <ul className="space-y-3">
                {content.details.map((detail, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-[#2F2A25]"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    <span className="text-[#C6A664] mt-1">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
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
        </div>
      </section>
    </div>
  );
}

