"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Music, FileText, Search, Share2 } from "lucide-react";
import Image from "next/image";
import { EcosystemHeader } from "@/components/beyond-center/ecosystem-header";

export function BeyondNotePage() {
  const blue = "#006CFF";
  const white = "#FFFFFF";
  const black = "#000000";

  return (
    <div className="min-h-screen bg-white">
      <EcosystemHeader ecosystem="note" title="Beyond Note" />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
            alt="Beyond Note"
            fill
            className="object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 
              className="text-6xl md:text-8xl font-light mb-6 leading-tight text-white"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.03em',
                fontWeight: 300
              }}
            >
              Beyond Note
            </h1>
            <p 
              className="text-2xl md:text-3xl font-light mb-12 text-white/80"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
              }}
            >
              Prise de notes intelligente
            </p>
            <Link href="/beyond-center/pre-inscription">
              <Button 
                size="lg"
                className="rounded-full px-10 py-7 text-lg font-light"
                style={{ 
                  backgroundColor: blue,
                  color: white
                }}
              >
                Découvrir Beyond Note
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
            </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: FileText, title: "Organisation intelligente", description: "Structurez vos notes automatiquement" },
              { icon: Search, title: "Recherche avancée", description: "Retrouvez instantanément vos informations" },
              { icon: Share2, title: "Partage facile", description: "Collaborez et partagez vos notes" }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center p-8 rounded-2xl border border-gray-200 hover:border-[#006CFF] transition-colors"
                >
                  <Icon className="h-12 w-12 mx-auto mb-4" style={{ color: blue }} />
                  <h3 className="text-xl font-light mb-3 text-black">{feature.title}</h3>
                  <p className="text-gray-600 font-light">{feature.description}</p>
                </motion.div>
              );
            })}
                </div>
        </div>
      </section>
    </div>
  );
}
