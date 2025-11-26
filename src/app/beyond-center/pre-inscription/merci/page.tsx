"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function MerciPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-black" />
          </div>
        </motion.div>
        <h1 
          className="text-5xl md:text-6xl font-bold text-white mb-6"
          style={{ 
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
          }}
        >
          Merci pour votre pré-inscription
        </h1>
        <p className="text-xl text-gray-300 mb-8 font-light leading-relaxed">
          Nous avons bien reçu votre demande. Notre équipe va l'analyser et vous contacter dans les plus brefs délais pour finaliser votre inscription et vous proposer le parcours le plus adapté à vos objectifs.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/beyond-center">
            <Button 
              size="lg"
              className="rounded-full px-8 py-6 bg-white text-black hover:bg-gray-100 font-medium"
            >
              Retour à l'accueil
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/beyond-center/inscription">
            <Button 
              size="lg"
              variant="outline"
              className="rounded-full px-8 py-6 border-2 border-white/20 text-white hover:bg-white/10"
            >
              Finaliser mon inscription
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

