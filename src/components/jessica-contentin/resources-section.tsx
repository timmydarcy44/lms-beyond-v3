"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, FileText, Video, Download } from "lucide-react";
import { useRouter } from "next/navigation";

export function ResourcesSection() {
  const router = useRouter();

  const handleGoToResources = () => {
    router.push('/jessica-contentin/ressources');
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-20 bg-[#F8F5F0] mx-4 mb-4 rounded-2xl"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Texte à gauche */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h2
                className="text-4xl md:text-5xl font-bold text-[#2F2A25] mb-4"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Mes Ressources
              </h2>
              <p
                className="text-lg md:text-xl text-[#2F2A25]/80 leading-relaxed"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Découvrez une collection de ressources pour vous accompagner dans votre développement personnel et professionnel.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-[#E6D9C6]/30 rounded-lg">
                  <BookOpen className="h-6 w-6 text-[#C6A664]" />
                </div>
                <div>
                  <h3
                    className="text-lg font-semibold text-[#2F2A25] mb-1"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    Guides et documents
                  </h3>
                  <p className="text-[#2F2A25]/70 text-sm">
                    Accédez à des guides pratiques et des documents téléchargeables
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-[#E6D9C6]/30 rounded-lg">
                  <Video className="h-6 w-6 text-[#C6A664]" />
                </div>
                <div>
                  <h3
                    className="text-lg font-semibold text-[#2F2A25] mb-1"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    Vidéos et formations
                  </h3>
                  <p className="text-[#2F2A25]/70 text-sm">
                    Explorez des contenus vidéo et des formations en ligne
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-[#E6D9C6]/30 rounded-lg">
                  <FileText className="h-6 w-6 text-[#C6A664]" />
                </div>
                <div>
                  <h3
                    className="text-lg font-semibold text-[#2F2A25] mb-1"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    Ressources personnalisées
                  </h3>
                  <p className="text-[#2F2A25]/70 text-sm">
                    Des ressources adaptées à vos besoins spécifiques
                  </p>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="pt-4"
            >
              <Button
                onClick={handleGoToResources}
                size="lg"
                className="bg-[#C6A664] hover:bg-[#B88A44] text-white rounded-full px-8 py-6 text-lg transition-transform hover:scale-105"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                }}
              >
                Accéder aux ressources
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Image/Illustration à droite */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#E6D9C6] to-[#C6A664] p-12">
              <div className="text-center space-y-6">
                <div className="mx-auto w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Download className="h-12 w-12 text-white" />
                </div>
                <div>
                  <h3
                    className="text-2xl font-bold text-white mb-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    Bibliothèque complète
                  </h3>
                  <p className="text-white/90">
                    Toutes mes ressources à portée de main
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

