"use client";

import { useState, useRef } from "react";
import { Mail, ArrowRight, CheckCircle, GraduationCap, Award, Target, TrendingUp, Users, Sparkles, Briefcase, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, useInView } from "framer-motion";
import Image from "next/image";

const benefits = [
  {
    icon: GraduationCap,
    title: "Formations Beyond No School",
    description: "Accédez à un catalogue complet de formations en ligne pour développer vos compétences professionnelles.",
    impact: "Chaque formation complétée renforce votre profil et augmente votre visibilité auprès des recruteurs.",
    color: "from-blue-500 to-blue-600",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop",
    // Image spécifique Beyond No School - style Netflix
    screenshot: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop",
  },
  {
    icon: Award,
    title: "Test des Soft Skills",
    description: "Évaluez et développez vos compétences comportementales pour mieux vous connaître et progresser.",
    impact: "Un profil avec des soft skills validées est 3x plus attractif pour les recruteurs.",
    color: "from-purple-500 to-purple-600",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
    // Image spécifique test soft skills - quiz/interactif
    screenshot: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop",
  },
  {
    icon: Zap,
    title: "Qualifier vos compétences avec des Open Badges",
    description: "Obtenez des certifications numériques reconnues qui attestent de vos compétences et réalisations.",
    impact: "Les candidats avec des Open Badges sont prioritaires dans les processus de recrutement.",
    color: "from-yellow-500 to-orange-500",
    image: "https://images.unsplash.com/photo-1559028012-481c04fa702d?q=80&w=2076&auto=format&fit=crop",
  },
  {
    icon: Target,
    title: "Système de Matching",
    description: "Trouvez les offres d'emploi, stages et alternances qui correspondent parfaitement à votre profil.",
    impact: "Plus votre profil est complet, plus le matching est précis et vos chances de recrutement augmentent.",
    color: "from-green-500 to-green-600",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop",
  },
  {
    icon: TrendingUp,
    title: "Développement des compétences",
    description: "Progressez grâce à des parcours personnalisés et des recommandations adaptées à vos objectifs.",
    impact: "Un profil qui évolue constamment démontre votre motivation et votre capacité d'apprentissage.",
    color: "from-orange-500 to-orange-600",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop",
  },
  {
    icon: Briefcase,
    title: "Augmentez vos chances",
    description: "Multipliez vos opportunités de trouver un emploi, une alternance ou un stage grâce à notre réseau.",
    impact: "Les candidats avec un profil complet et qualifié reçoivent 5x plus de propositions d'entretien.",
    color: "from-red-500 to-red-600",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop",
  },
];

export function CandidateSignupPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const benefitsRef = useRef(null);
  const isInView = useInView(benefitsRef, { once: true, margin: "-100px" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/beyond-connect/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'inscription");
      }

      setSuccess(true);
      
      // Afficher un message différent si l'email n'a pas pu être envoyé
      if (data.warning) {
        toast.warning(data.message || "Compte créé mais email non envoyé. Contactez le support.");
      } else {
        toast.success("Email de confirmation envoyé !");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md border-gray-200 bg-white shadow-2xl">
            <CardContent className="p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg"
              >
                <CheckCircle className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="mb-4 text-3xl font-bold text-gray-900">
                Email envoyé !
              </h2>
              <p className="mb-6 text-lg text-gray-600">
                Nous avons envoyé un email de confirmation à <strong style={{ color: '#003e71' }}>{email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Cliquez sur le lien dans l'email pour confirmer votre inscription et créer votre profil.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section avec image et formulaire */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop"
            alt="Professionnels en réunion"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay avec gradient - bleu foncé avec touche de rouge */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#003e71]/95 via-[#003087]/90 to-[#002a6b]/95" style={{ background: 'linear-gradient(to bottom right, rgba(0, 62, 113, 0.95), rgba(0, 48, 135, 0.90), rgba(0, 42, 107, 0.95)), radial-gradient(circle at 30% 20%, rgba(220, 38, 38, 0.08), transparent)' }} />
          
          {/* Effet de lumière animé */}
          <motion.div
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-radial from-blue-400/30 via-blue-300/20 to-transparent rounded-full blur-3xl"
          />
        </div>

        {/* Contenu Hero */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Texte à gauche */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-white"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <Sparkles className="h-5 w-5 text-yellow-300" />
                <span className="text-sm font-medium">L'avenir de votre carrière commence ici</span>
              </motion.div>
              
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Créez votre compte
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                  Beyond Connect
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed">
                Développez vos compétences, testez vos soft skills et multipliez vos chances de trouver l'emploi, l'alternance ou le stage de vos rêves.
              </p>

              {/* Formulaire dans le hero */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl"
              >
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        className="h-14 text-lg bg-white/95 border-0 rounded-xl px-6 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-400"
                        required
                        disabled={loading}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      size="lg"
                      className="h-14 px-8 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                      style={{ 
                        backgroundColor: '#003e71',
                        color: 'white',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#003087';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#003e71';
                      }}
                    >
                      {loading ? (
                        "Envoi..."
                      ) : (
                        <>
                          Créer mon compte
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-blue-100 text-center">
                    En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
                  </p>
                </form>
              </motion.div>
            </motion.div>

            {/* Image à droite (optionnel, peut être masquée sur mobile) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block relative h-[600px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20"
            >
              <Image
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
                alt="Succès professionnel"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#003e71]/50 to-transparent" style={{ background: 'linear-gradient(to top, rgba(0, 62, 113, 0.5), transparent), radial-gradient(circle at 50% 0%, rgba(220, 38, 38, 0.05), transparent)' }} />
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white/70"
          >
            <ArrowRight className="h-6 w-6 rotate-90" />
          </motion.div>
        </motion.div>
      </section>

      {/* Section Introduction Impact */}
      <section 
        className="py-20 text-white"
        style={{ 
          background: 'linear-gradient(to bottom right, #003e71, #003087, #002a6b), radial-gradient(circle at 20% 50%, rgba(220, 38, 38, 0.1), transparent)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Plus votre profil est complet, plus vous êtes recrutable
            </h2>
            <p className="text-xl lg:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
              Les recruteurs privilégient les candidats qui valorisent leurs compétences. 
              <br />
              <span className="font-semibold text-white">
                Open Badges, Soft Skills, Formations complétées = Profil attractif
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Sections Bénéfices détaillées */}
      <section ref={benefitsRef} className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin pour <span className="text-[#003e71]">réussir</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Un écosystème complet qui valorise chaque compétence et augmente votre employabilité
            </p>
          </motion.div>

          {/* Sections individuelles pour chaque bénéfice */}
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            const isEven = index % 2 === 0;
            
            return (
              <motion.section
                key={benefit.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={`mb-24 ${index < benefits.length - 1 ? 'border-b border-gray-200 pb-24' : ''}`}
              >
                <div className={`grid lg:grid-cols-2 gap-12 items-center ${!isEven ? 'lg:grid-flow-dense' : ''}`}>
                  {/* Image - Utiliser screenshot si disponible, sinon image par défaut */}
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className={`relative h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-200 ${!isEven ? 'lg:col-start-2' : ''}`}
                  >
                    <Image
                      src={benefit.screenshot || benefit.image}
                      alt={benefit.title}
                      fill
                      className="object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-15`} />
                    {/* Overlay avec touche de rouge très légère */}
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-red-500/5" />
                  </motion.div>

                  {/* Contenu */}
                  <motion.div
                    initial={{ opacity: 0, x: isEven ? 50 : -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className={!isEven ? 'lg:col-start-1 lg:row-start-1' : ''}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                      className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${benefit.color} mb-6 shadow-lg`}
                    >
                      <Icon className="h-10 w-10 text-white" />
                    </motion.div>
                    
                    <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                      {benefit.title}
                    </h3>
                    
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                      {benefit.description}
                    </p>

                    {/* Impact sur le recrutement */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-l-4 border-green-500 rounded-lg p-6 mb-6">
                      <div className="flex items-start gap-3">
                        <TrendingUp className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900 mb-1">Impact sur votre recrutement</p>
                          <p className="text-gray-700 leading-relaxed">
                            {benefit.impact}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.section>
            );
          })}

          {/* CTA Final */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 text-center"
          >
            <Card 
              className="border-2 shadow-2xl"
              style={{ 
                borderColor: '#003e71',
                background: 'linear-gradient(to bottom right, #003e71, #003087, #002a6b), radial-gradient(circle at 30% 30%, rgba(220, 38, 38, 0.08), transparent)',
              }}
            >
              <CardContent className="p-12">
                <Zap className="h-16 w-16 text-yellow-300 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-white mb-4">
                  Prêt à transformer votre carrière ?
                </h3>
                <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                  Rejoignez des milliers de candidats qui ont déjà trouvé leur voie grâce à Beyond Connect
                </p>
                <form onSubmit={handleSubmit} className="max-w-md mx-auto flex gap-3">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="h-14 text-lg bg-white border-0 rounded-xl px-6 text-gray-900"
                    required
                    disabled={loading}
                  />
                    <Button
                      type="submit"
                      disabled={loading}
                      size="lg"
                      className="h-14 px-8 font-semibold rounded-xl shadow-lg"
                      style={{ 
                        backgroundColor: '#003e71',
                        color: 'white',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#003087';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#003e71';
                      }}
                    >
                    {loading ? "..." : <ArrowRight className="h-5 w-5" />}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

