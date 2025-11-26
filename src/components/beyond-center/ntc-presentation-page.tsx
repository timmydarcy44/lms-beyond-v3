"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  CheckCircle2, 
  Target, 
  Users, 
  TrendingUp, 
  Award,
  Briefcase,
  MessageSquare,
  BarChart3,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Calendar,
  GraduationCap
} from "lucide-react";

export function NTCPresentationPage() {
  const blue = "#006CFF";
  const white = "#FFFFFF";
  const black = "#000000";

  const competences = [
    {
      icon: MessageSquare,
      title: "Négociation commerciale",
      description: "Maîtrise des techniques de vente et de négociation B2B"
    },
    {
      icon: BarChart3,
      title: "Analyse commerciale",
      description: "Élaboration de stratégies commerciales et suivi de performance"
    },
    {
      icon: Users,
      title: "Gestion de portefeuille clients",
      description: "Développement et fidélisation de la clientèle"
    },
    {
      icon: Target,
      title: "Prospection",
      description: "Identification et développement de nouveaux marchés"
    },
    {
      icon: Briefcase,
      title: "Conseil technique",
      description: "Accompagnement client dans le choix de solutions adaptées"
    },
    {
      icon: TrendingUp,
      title: "Management commercial",
      description: "Animation d'équipe et pilotage de la performance"
    }
  ];

  const modules = [
    {
      title: "Fondamentaux du commerce B2B",
      duration: "120h",
      content: [
        "Environnement commercial et économique",
        "Techniques de vente et négociation",
        "Communication commerciale",
        "Éthique et déontologie"
      ]
    },
    {
      title: "Gestion commerciale",
      duration: "100h",
      content: [
        "Gestion de portefeuille clients",
        "CRM et outils commerciaux",
        "Analyse de performance",
        "Reporting commercial"
      ]
    },
    {
      title: "Conseil et expertise technique",
      duration: "80h",
      content: [
        "Analyse des besoins clients",
        "Conseil en solutions techniques",
        "Argumentation commerciale",
        "Gestion d'objections"
      ]
    },
    {
      title: "Développement commercial",
      duration: "100h",
      content: [
        "Prospection et développement",
        "Stratégie commerciale",
        "Animation réseau",
        "Partenariats stratégiques"
      ]
    }
  ];

  const debouches = [
    {
      title: "Commercial B2B",
      description: "Négociation de contrats avec les entreprises",
      salary: "35-45k€",
      icon: Briefcase
    },
    {
      title: "Business Developer",
      description: "Développement de nouveaux marchés",
      salary: "40-50k€",
      icon: TrendingUp
    },
    {
      title: "Account Manager",
      description: "Gestion de portefeuille clients stratégiques",
      salary: "38-48k€",
      icon: Users
    },
    {
      title: "Responsable commercial",
      description: "Encadrement d'équipe commerciale",
      salary: "45-60k€",
      icon: Target
    }
  ];

  const temoignages = [
    {
      name: "Sophie Martin",
      role: "Commerciale B2B",
      company: "Tech Solutions",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop",
      quote: "Le titre NTC m'a permis d'acquérir une expertise reconnue et de progresser rapidement dans ma carrière commerciale."
    },
    {
      name: "Thomas Dubois",
      role: "Business Developer",
      company: "Innovation Plus",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop",
      quote: "Une formation complète qui allie théorie et pratique. J'ai pu mettre en application immédiatement les compétences acquises."
    },
    {
      name: "Marie Leclerc",
      role: "Account Manager",
      company: "Digital Services",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop",
      quote: "L'accompagnement personnalisé et la qualité de la formation m'ont permis d'obtenir mon titre avec succès."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/beyond-center">
              <div 
                className="text-2xl font-bold text-white"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                BEYOND <span className="font-light">CENTER</span>
              </div>
            </Link>
            <Link href="/beyond-center/pre-inscription">
              <Button 
                className="rounded-full px-6 py-2 font-light"
                style={{ 
                  backgroundColor: blue,
                  color: white
                }}
              >
                Pré-inscription
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-b from-black via-black to-gray-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop"
            alt="Formation commerciale"
            fill
            className="object-cover"
            priority
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="mb-6">
                <span 
                  className="text-sm uppercase tracking-wider text-[#006CFF] font-light"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                  }}
                >
                  Titre Professionnel Niveau 4
                </span>
              </div>
              <h1 
                className="text-5xl md:text-7xl font-light mb-6 leading-tight text-white"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.03em',
                  fontWeight: 300
                }}
              >
                Négociateur<br />
                Technico-Commercial
              </h1>
              <p 
                className="text-xl text-white/80 font-light mb-8 leading-relaxed"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Développez votre expertise commerciale et technique. 
                Un titre reconnu par l'État pour accélérer votre carrière dans le commerce B2B.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/beyond-center/pre-inscription">
                  <Button 
                    size="lg"
                    className="rounded-full px-8 py-6 text-lg font-light"
                    style={{ 
                      backgroundColor: blue,
                      color: white
                    }}
                  >
                    S'inscrire maintenant
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#programme">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="rounded-full px-8 py-6 text-lg font-light border-white/20 text-white hover:bg-white/10"
                  >
                    Découvrir le programme
                  </Button>
                </Link>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-[500px] rounded-3xl overflow-hidden"
            >
              <Image
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop"
                alt="Formation NTC"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Info Cards */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Award, label: "Titre reconnu", value: "Niveau 4" },
              { icon: Clock, label: "Durée", value: "12 mois" },
              { icon: Calendar, label: "Rythme", value: "Alternance" },
              { icon: GraduationCap, label: "Certification", value: "RNCP" }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center p-6 rounded-2xl border border-gray-200 hover:border-[#006CFF] transition-colors"
                >
                  <Icon className="h-8 w-8 mx-auto mb-4" style={{ color: blue }} />
                  <div 
                    className="text-3xl font-light mb-2 text-black"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    {item.value}
                  </div>
                  <div 
                    className="text-sm text-gray-600 font-light"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    {item.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Présentation */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative h-[500px] rounded-3xl overflow-hidden"
            >
              <Image
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
                alt="Formation professionnelle"
                fill
                className="object-cover"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 
                className="text-4xl md:text-5xl font-light mb-6 text-black"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  letterSpacing: '-0.02em',
                  fontWeight: 300
                }}
              >
                Un titre professionnel<br />
                reconnu par l'État
              </h2>
              <p 
                className="text-lg text-gray-700 font-light mb-6 leading-relaxed"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Le titre professionnel de Négociateur Technico-Commercial (NTC) est un diplôme de niveau 4 
                inscrit au Répertoire National des Certifications Professionnelles (RNCP). 
                Il atteste de compétences reconnues dans le domaine du commerce B2B.
              </p>
              <p 
                className="text-lg text-gray-700 font-light mb-8 leading-relaxed"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                }}
              >
                Cette formation vous permet de maîtriser les techniques de négociation, de gestion commerciale 
                et de conseil technique, tout en développant votre expertise dans la prospection et 
                l'animation de portefeuille clients.
              </p>
              <Link href="/beyond-center/pre-inscription">
                <Button 
                  className="rounded-full px-8 py-6 font-light"
                  style={{ 
                    backgroundColor: blue,
                    color: white
                  }}
                >
                  En savoir plus
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Compétences */}
      <section className="py-32 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 
              className="text-4xl md:text-5xl font-light mb-6 text-white"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.02em',
                fontWeight: 300
              }}
            >
              Les compétences développées
            </h2>
            <p 
              className="text-xl text-white/70 font-light max-w-2xl mx-auto"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
              }}
            >
              Un programme complet pour maîtriser tous les aspects du métier
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {competences.map((competence, index) => {
              const Icon = competence.icon;
              return (
                <motion.div
                  key={competence.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-8 rounded-2xl bg-[#1A1A1A] border border-white/10 hover:border-[#006CFF] transition-all"
                >
                  <div className="mb-6">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: `${blue}20` }}
                    >
                      <Icon className="h-8 w-8" style={{ color: blue }} />
                    </div>
                  </div>
                  <h3 
                    className="text-xl font-light mb-3 text-white"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    {competence.title}
                  </h3>
                  <p 
                    className="text-white/70 font-light leading-relaxed"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    {competence.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Programme */}
      <section id="programme" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 
              className="text-4xl md:text-5xl font-light mb-6 text-black"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.02em',
                fontWeight: 300
              }}
            >
              Programme de formation
            </h2>
            <p 
              className="text-xl text-gray-600 font-light max-w-2xl mx-auto"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
              }}
            >
              400 heures de formation réparties sur 12 mois
            </p>
          </motion.div>

          <div className="space-y-6">
            {modules.map((module, index) => (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 rounded-2xl border-2 border-gray-200 hover:border-[#006CFF] transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-light"
                        style={{ backgroundColor: blue }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <h3 
                          className="text-2xl font-light text-black"
                          style={{ 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                          }}
                        >
                          {module.title}
                        </h3>
                        <p 
                          className="text-sm text-gray-600 font-light"
                          style={{ 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                          }}
                        >
                          {module.duration}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-2 ml-16">
                      {module.content.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: blue }} />
                          <span 
                            className="text-gray-700 font-light"
                            style={{ 
                              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                            }}
                          >
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Débouchés */}
      <section className="py-32 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 
              className="text-4xl md:text-5xl font-light mb-6 text-white"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.02em',
                fontWeight: 300
              }}
            >
              Vos débouchés professionnels
            </h2>
            <p 
              className="text-xl text-white/70 font-light max-w-2xl mx-auto"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
              }}
            >
              Des opportunités dans tous les secteurs d'activité
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {debouches.map((debouche, index) => {
              const Icon = debouche.icon;
              return (
                <motion.div
                  key={debouche.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-8 rounded-2xl bg-[#1A1A1A] border border-white/10 hover:border-[#006CFF] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${blue}20` }}
                      >
                        <Icon className="h-6 w-6" style={{ color: blue }} />
                      </div>
                      <div>
                        <h3 
                          className="text-xl font-light text-white"
                          style={{ 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                          }}
                        >
                          {debouche.title}
                        </h3>
                        <p 
                          className="text-sm text-white/60 font-light"
                          style={{ 
                            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                          }}
                        >
                          {debouche.description}
                        </p>
                      </div>
                    </div>
                    <div 
                      className="text-lg font-light text-[#006CFF]"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                      }}
                    >
                      {debouche.salary}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 
              className="text-4xl md:text-5xl font-light mb-6 text-black"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.02em',
                fontWeight: 300
              }}
            >
              Ils ont obtenu leur titre NTC
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {temoignages.map((temoignage, index) => (
              <motion.div
                key={temoignage.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-8 rounded-2xl border border-gray-200"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden">
                    <Image
                      src={temoignage.image}
                      alt={temoignage.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div 
                      className="font-light text-black"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                      }}
                    >
                      {temoignage.name}
                    </div>
                    <div 
                      className="text-sm text-gray-600 font-light"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                      }}
                    >
                      {temoignage.role} • {temoignage.company}
                    </div>
                  </div>
                </div>
                <p 
                  className="text-gray-700 font-light leading-relaxed italic"
                  style={{ 
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                  }}
                >
                  "{temoignage.quote}"
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 
              className="text-4xl md:text-6xl font-light mb-6 text-white"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                letterSpacing: '-0.03em',
                fontWeight: 300
              }}
            >
              Prêt à développer<br />
              vos compétences ?
            </h2>
            <p 
              className="text-xl text-white/70 font-light mb-12 max-w-2xl mx-auto"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
              }}
            >
              Rejoignez la prochaine promotion et obtenez votre titre professionnel NTC
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/beyond-center/pre-inscription">
                <Button 
                  size="lg"
                  className="rounded-full px-10 py-7 text-lg font-light"
                  style={{ 
                    backgroundColor: blue,
                    color: white
                  }}
                >
                  S'inscrire maintenant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/beyond-center">
                <Button 
                  size="lg"
                  variant="outline"
                  className="rounded-full px-10 py-7 text-lg font-light border-white/20 text-white hover:bg-white/10"
                >
                  Retour au site
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div 
              className="text-xl font-bold text-white"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
              }}
            >
              BEYOND <span className="font-light">CENTER</span>
            </div>
            <div className="flex items-center gap-6 text-white/60 text-sm font-light">
              <Link href="/beyond-center" className="hover:text-white transition-colors">
                Accueil
              </Link>
              <Link href="/beyond-center/pre-inscription" className="hover:text-white transition-colors">
                Pré-inscription
              </Link>
              <Link href="/beyond-center/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

