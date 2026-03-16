import Link from "next/link";
import { Eye } from "lucide-react";
import { glassCardClass, glassPanelClass, glassFaqClass } from "@/app/app-landing/feature-styles";

export default function ModeFocusPage() {
  return (
    <main>
      <section
        className="relative overflow-hidden flex items-center justify-center text-center min-h-screen"
        style={{ background: "linear-gradient(135deg, #be1354 0%, #d4434a 30%, #e8673a 60%, #F97316 100%)" }}
      >
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ background: "radial-gradient(circle, #ffffff, transparent)" }} />

        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-24 pb-20">
          <div className="w-16 h-16 rounded-2xl bg-white/20 mx-auto mb-6 flex items-center justify-center backdrop-blur-sm border border-white/30">
            <Eye className="h-8 w-8 text-white" />
          </div>
          <p className="text-white/70 text-xs font-bold tracking-[0.3em] uppercase mb-4">Mode Focus</p>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">Concentre-toi sans distraction</h1>
          <p className="text-white/80 text-xl max-w-2xl mx-auto mb-10">Lecture immersive, mise en page apaisante et zéro bruit visuel.</p>
          <Link
            href="/app-landing/signup"
            className="inline-block px-8 py-4 rounded-full bg-white text-[#be1354] font-bold text-lg hover:scale-105 transition-transform shadow-xl"
          >
            Essayer gratuitement
          </Link>
          <div className="mt-4">
            <Link href="/app-landing" className="text-white/50 text-sm hover:text-white transition-colors">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-[#0F1117] mb-16">Comment ça marche</h2>
        <div className="grid grid-cols-3 gap-8">
          
          <div className="text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}>
              1
            </div>
            <h3 className="font-bold text-[#0F1117] mb-2">Active le Focus</h3>
            <p className="text-[#6B7280] text-sm">Un mode lecture sans distraction</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}>
              2
            </div>
            <h3 className="font-bold text-[#0F1117] mb-2">Lis sereinement</h3>
            <p className="text-[#6B7280] text-sm">Mise en page claire et douce</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg"
              style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}>
              3
            </div>
            <h3 className="font-bold text-[#0F1117] mb-2">Retiens mieux</h3>
            <p className="text-[#6B7280] text-sm">Concentration maximale</p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#F8F9FC]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-[#0F1117] mb-12">Un mode pensé pour la concentration</h2>
          <div className="grid grid-cols-2 gap-6">
            
            <div className="bg-white rounded-2xl p-6 border border-[#E8E9F0]">
              <div className="w-2 h-8 rounded-full mb-4"
                style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }} />
              <h3 className="font-bold text-[#0F1117] mb-2">Lecture immersive</h3>
              <p className="text-[#6B7280] text-sm">Mise en page épurée.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-[#E8E9F0]">
              <div className="w-2 h-8 rounded-full mb-4"
                style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }} />
              <h3 className="font-bold text-[#0F1117] mb-2">DYS friendly</h3>
              <p className="text-[#6B7280] text-sm">Police et contrastes adaptés.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-[#E8E9F0]">
              <div className="w-2 h-8 rounded-full mb-4"
                style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }} />
              <h3 className="font-bold text-[#0F1117] mb-2">Moins de fatigue</h3>
              <p className="text-[#6B7280] text-sm">Lecture confortable.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-[#E8E9F0]">
              <div className="w-2 h-8 rounded-full mb-4"
                style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }} />
              <h3 className="font-bold text-[#0F1117] mb-2">Plus d'efficacité</h3>
              <p className="text-[#6B7280] text-sm">Tu avances plus vite.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold text-[#0F1117] mb-4">Prêt à te concentrer ?</h2>
        <p className="text-[#6B7280] mb-8">Essai gratuit · Sans engagement · Sans carte bancaire</p>
        <Link
          href="/app-landing/signup"
          className="inline-block px-8 py-4 rounded-full text-white font-bold hover:scale-105 transition-transform"
          style={{ background: "linear-gradient(135deg, #be1354, #F97316)" }}
        >
          Commencer gratuitement →
        </Link>
        <div className="mt-4">
          <Link href="/app-landing" className="text-sm text-[#9CA3AF] hover:text-[#be1354]">
            ← Retour à l'accueil
          </Link>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-white mb-4">Découvrir d'autres outils</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/app-landing/features/pomodoro"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Pomodoro
            </Link>
            <Link
              href="/app-landing/features/neuro-adapte"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/30 text-white text-sm hover:bg-white/25 transition-colors"
            >
              Neuro adapté
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
