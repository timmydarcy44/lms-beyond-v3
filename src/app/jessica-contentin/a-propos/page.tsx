import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="space-y-12">
            <div>
              <h1
                className="text-5xl font-bold text-[#2F2A25] mb-6"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                A propos
              </h1>
            </div>

            <div className="relative h-96 rounded-2xl overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&q=80"
                alt="Jessica CONTENTIN"
                fill
                className="object-cover"
              />
            </div>

            <div
              className="prose prose-lg max-w-none text-[#2F2A25] leading-relaxed space-y-6"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              <div>
                <h2
                  className="text-3xl font-bold text-[#2F2A25] mb-4"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Jessica CONTENTIN
                </h2>
                <p className="text-xl text-[#2F2A25]/80 mb-6">
                  Psychopédagogue certifiée en neuroéducation.
                </p>
              </div>

              <p>
                Diplômée d'un Master en Ingénierie et Management de l'Intervention Sociale (IAE de Caen) ainsi que d'un Master en Éducation, Enseignement et Formation (MEEF) à l'INSPE, je suis également professeure certifiée dans le domaine de la santé depuis 2015. Cette double expertise m'a permis de développer une solide expérience dans l'accompagnement éducatif et l'inclusion scolaire.
              </p>

              <p>
                Passionnée par la psychologie de l'éducation et la psychopédagogie, j'adopte une approche globale qui intègre les dimensions cognitive, émotionnelle et comportementale de chaque individu. Afin de répondre aux besoins spécifiques, j'ai suivi plusieurs formations certifiantes me permettant d'accompagner des jeunes présentant des troubles du neurodéveloppement (troubles DYS, TDA-H) ou confrontés à des défis tels que le harcèlement ou la phobie scolaire.
              </p>

              <p>
                La gestion des émotions constitue un pilier central de mon travail, car elle est essentielle à la réussite scolaire et au bien-être. Mon objectif est de valoriser les forces de chaque élève, de renforcer leur confiance en eux et de favoriser leur inclusion, tout en révélant leur plein potentiel.
              </p>

              <div className="bg-[#E6D9C6]/30 rounded-2xl p-8 mt-8">
                <h3
                  className="text-2xl font-bold text-[#2F2A25] mb-4"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  Formations
                </h3>
                <ul className="space-y-2 text-[#2F2A25]">
                  <li>• Certificat d'Aptitude au Professorat de l'Enseignement du Second degré (CAPES)</li>
                  <li>• Master Ingénierie et Management de l'Intervention Sociale | IAE de Caen</li>
                  <li>• Master en Éducation, Enseignement et Formation (MEEF) | INSPE</li>
                  <li>• Certifications en neuroéducation et psychopédagogie</li>
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
        </div>
      </section>
    </div>
  );
}

