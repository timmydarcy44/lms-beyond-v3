"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function MerciPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex justify-center"
        >
          <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
        </motion.div>
        
        <div className="space-y-4">
          <h1 
            className="text-4xl md:text-6xl font-light text-black"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              letterSpacing: '-0.02em'
            }}
          >
            Rendez-vous confirmé !
          </h1>
          <p 
            className="text-xl text-gray-600 font-light"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
            }}
          >
            Nous avons bien reçu votre demande de rendez-vous. 
            Vous recevrez un email de confirmation sous peu.
          </p>
        </div>

        <div className="pt-8">
          <Link href="/beyond-center">
            <Button 
              size="lg"
              className="rounded-full px-10 py-7 text-lg font-light bg-black hover:bg-gray-800 text-white"
            >
              Retour à l'accueil
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

