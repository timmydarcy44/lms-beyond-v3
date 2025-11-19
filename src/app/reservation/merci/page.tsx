"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const firstName = searchParams.get("firstName") || "Cher(e) apprenant(e)";
  const date = searchParams.get("date") || "";
  const time = searchParams.get("time") || "";

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Image - Placeholder avec texture beige/dorée */}
          <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-amber-200 via-amber-100 to-orange-200">
            <div className="absolute inset-0 opacity-30">
              {/* Texture granulaire simulée */}
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 30%, rgba(180, 83, 9, 0.3) 1px, transparent 1px),
                  radial-gradient(circle at 60% 70%, rgba(217, 119, 6, 0.2) 1px, transparent 1px),
                  radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.25) 1px, transparent 1px),
                  radial-gradient(circle at 40% 80%, rgba(194, 65, 12, 0.2) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px, 80px 80px, 60px 60px, 70px 70px',
                backgroundPosition: '0 0, 20px 20px, 40px 40px, 10px 10px'
              }} />
            </div>
            {/* Effet de lumière */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-50/20 to-orange-100/30" />
            {/* Motif diagonal */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-300/10 via-transparent to-orange-300/10" 
                 style={{ transform: 'rotate(-15deg) scale(1.5)' }} />
          </div>

          {/* Message de remerciement */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="h-12 w-12 text-amber-700" />
              <h1 
                className="text-4xl font-semibold text-amber-900"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
              >
                Merci {firstName} !
              </h1>
            </div>
            
            <div 
              className="text-xl text-amber-800/90 leading-relaxed space-y-4"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
            >
              <p>
                Je vous confirme votre rendez-vous du <strong>{date}</strong> à <strong>{time}</strong>.
              </p>
              <p className="text-lg text-amber-700/80">
                Vous recevrez un email de confirmation avec tous les détails de votre rendez-vous.
              </p>
              <p className="text-lg text-amber-700/80">
                À très bientôt !
              </p>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-amber-900">Chargement...</div>
      </div>
    }>
      <ThankYouContent />
    </Suspense>
  );
}

