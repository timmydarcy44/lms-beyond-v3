"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function QuizMerciPage() {
  return (
    <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="flex justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-[#C6A664] flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
        </motion.div>
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#2F2A25] mb-4">
            Merci pour votre participation !
          </h1>
          <p className="text-lg text-[#2F2A25]/70">
            Nous avons bien reçu vos informations. Notre équipe va analyser vos réponses et vous
            contacter prochainement avec des recommandations personnalisées.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button
            asChild
            className="rounded-full px-8 py-6 bg-[#C6A664] hover:bg-[#B88A44] text-white"
          >
            <Link href="/">Retour à l'accueil</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full px-8 py-6 border-2 border-[#E6D9C6] text-[#2F2A25] hover:bg-[#E6D9C6]/50"
          >
            <Link href="/ressources">Découvrir nos ressources</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

