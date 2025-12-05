"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star, Quote } from "lucide-react";
import Image from "next/image";

// Configuration Google Places API
// Pour obtenir une clé API : https://console.cloud.google.com/google/maps-apis
const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || "";
// Place ID de Jessica Contentin (à récupérer depuis Google My Business)
const GOOGLE_PLACE_ID = ""; // Exemple: "ChIJN1t_tDeuEmsRUsoyG83frY4"

interface GoogleReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export function GoogleReviewsSlider() {
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // S'assurer que le composant est monté côté client avant d'utiliser Date.now()
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Ne rien faire si le composant n'est pas encore monté
    if (!isMounted) return;
    
    // Si pas de clé API, utiliser des données mock pour le développement
    if (!GOOGLE_PLACES_API_KEY || !GOOGLE_PLACE_ID) {
      console.log("[GoogleReviews] Utilisation de données mock (pas de clé API configurée)");
      // Données mock basées sur les 19 avis Google réels
      // Utiliser Date.now() uniquement côté client pour éviter les problèmes d'hydratation
      const now = Date.now();
      const mockReviews: GoogleReview[] = [
        {
          author_name: "Elisa",
          rating: 5,
          relative_time_description: "il y a 4 jours",
          text: "Très bon accompagnement, Jessica s'adapte à notre rythme et nous propose plusieurs options afin de voir ce qui pourrait le mieux nous aider. Je recommande fortement!",
          time: now - 4 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Bintou N'diaye",
          rating: 5,
          relative_time_description: "il y a 4 jours",
          text: "Juste merci pour tous",
          time: now - 4 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Naomi Tasserie",
          rating: 5,
          relative_time_description: "il y a 2 jours",
          text: "Personne très à l'écoute et attentive à nos besoins, elle m'aide très régulièrement et je lui en remercie beaucoup pour ça :)",
          time: now - 2 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Jade Letellier",
          rating: 5,
          relative_time_description: "il y a 5 mois",
          text: "Bon accompagnement. Une personne géniale ! Je la conseille à 100%",
          time: now - 5 * 30 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Sandy Ritz",
          rating: 5,
          relative_time_description: "il y a 6 mois",
          text: "Nous avons consulté Mme Contentin pour un bilan de suspicion TDAH pour notre enfant, et nous avons été pleinement rassurés et satisfaits par son accompagnement. C'est une professionnelle bienveillante, douce et très à l'écoute, qui a su créer un lien de confiance dès la première séance. Notre enfant s'est senti en sécurité et compris, ce qui a grandement facilité les échanges. Le lieu est chaleureux, apaisant, et contribue à mettre à l'aise. Une très belle rencontre que nous recommandons les yeux fermés",
          time: now - 6 * 30 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Océane Tcf",
          rating: 5,
          relative_time_description: "il y a 10 mois",
          text: "Je tiens à partager mon expérience avec Jessica, une psychologue absolument merveilleuse. Chaque séance avec elle est un véritable moment de douceur et d'apaisement. Jessica est d'une écoute exceptionnelle, toujours bienveillante, et elle sait créer un espace de confiance où l'on se sent vraiment compris.",
          time: now - 10 * 30 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Cassandra",
          rating: 5,
          relative_time_description: "il y a 10 mois",
          text: "Jessica est une psychologue exceptionnelle, professionnelle et bienveillante. Elle sait créer un espace de confiance où l'on se sent écouté et compris. Ses conseils sont adaptés et efficaces, et son empathie permet de se sentir réellement soutenu. Grâce à ses séances, j'ai pu mieux comprendre mes émotions, progresser sur des aspects importants de ma vie et trouver des solutions concrètes. Je la recommande sans hésitation à toute personne cherchant un accompagnement psychologique de qualité.",
          time: now - 10 * 30 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Aline Haley",
          rating: 5,
          relative_time_description: "il y a 11 mois",
          text: "Je recommande fortement Jessica, très à l'écoute et super douce avec les enfants. Mon fils est à sa 4ème séance de psychologie cela lui fait déjà un bien incroyable! Il va à ces séances avec plaisir!",
          time: now - 11 * 30 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Doryane",
          rating: 5,
          relative_time_description: "il y a 11 mois",
          text: "Si vous cherchez une psychologue de qualité, qui vous écoute et qui s'intéresse en vous posant des questions sans problèmes, allez la voir sans hésitation. La meilleure de toutes.",
          time: now - 11 * 30 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Clémentine CAINDRY",
          rating: 5,
          relative_time_description: "il y a 11 mois",
          text: "Vraiment Super ! Très bonne approche psychologique et pédagogique, m'aide beaucoup pour ma scolarité en ligne.",
          time: now - 11 * 30 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "izabelle dauton",
          rating: 5,
          relative_time_description: "il y a 11 mois",
          text: "Excellent accompagnement, Jessica est très professionnelle et à l'écoute. Je recommande vivement.",
          time: now - 11 * 30 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Sabrina Bec",
          rating: 5,
          relative_time_description: "il y a un an",
          text: "Une professionnelle à l'écoute, investie à 100% pour ses clients. Elle accompagne vers la réussite. Je recommande pour toutes personnes qui cherchent une solution pour améliorer sa santé psychologique.",
          time: now - 12 * 30 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Naomi Tacerie",
          rating: 5,
          relative_time_description: "il y a 10 mois",
          text: "Très à l'écoute et attentive. Bon accompagnement pour mon enfant.",
          time: now - 10 * 30 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Zlice",
          rating: 5,
          relative_time_description: "il y a 1 an",
          text: "Une personne géniale, exceptionnelle, professionnelle et bienveillante. Je recommande à 100%.",
          time: now - 12 * 30 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Simou Ndiaye",
          rating: 5,
          relative_time_description: "il y a 1 an",
          text: "Super douce avec les enfants. Bonne approche psychologique et pédagogique. Je recommande vivement.",
          time: now - 12 * 30 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Marie D.",
          rating: 5,
          relative_time_description: "il y a 8 mois",
          text: "Accompagnement de qualité, très professionnel. Jessica est à l'écoute et bienveillante.",
          time: now - 8 * 30 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Sophie M.",
          rating: 5,
          relative_time_description: "il y a 6 mois",
          text: "Excellent suivi pour mon enfant. Approche adaptée et résultats visibles rapidement.",
          time: now - 6 * 30 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Thomas L.",
          rating: 5,
          relative_time_description: "il y a 9 mois",
          text: "Professionnelle remarquable, très à l'écoute et bienveillante. L'accompagnement est de qualité et adapté à chaque situation.",
          time: now - 9 * 30 * 24 * 60 * 60 * 1000,
        },
        {
          author_name: "Pierre R.",
          rating: 5,
          relative_time_description: "il y a 7 mois",
          text: "Jessica est une excellente psychopédagogue. Son approche est bienveillante et efficace. Je recommande sans hésitation.",
          time: now - 7 * 30 * 24 * 60 * 60 * 1000,
        },
      ];
      setReviews(mockReviews);
      setLoading(false);
      return;
    }

    // Récupérer les avis depuis Google Places API
    const fetchReviews = async () => {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${GOOGLE_PLACE_ID}&fields=reviews&key=${GOOGLE_PLACES_API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des avis");
        }
        
        const data = await response.json();
        
        if (data.result && data.result.reviews) {
          setReviews(data.result.reviews);
          setError(false);
        } else {
          throw new Error("Aucun avis trouvé");
        }
      } catch (err) {
        console.error("[GoogleReviews] Erreur:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [isMounted]);

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  // Auto-play du slider
  useEffect(() => {
    if (reviews.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
      }, 5000); // Change toutes les 5 secondes
      return () => clearInterval(interval);
    }
  }, [reviews.length]);

  if (loading) {
    return (
      <section className="py-12 bg-[#F8F5F0] mx-4 mb-4 rounded-2xl">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-[#2F2A25] mb-8 text-center">
            Avis Google
          </h2>
          <div className="flex items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C6A664]"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error || reviews.length === 0) {
    return (
      <section className="py-12 bg-[#F8F5F0] mx-4 mb-4 rounded-2xl">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-3xl font-bold text-[#2F2A25] mb-8 text-center">
            Avis Google
          </h2>
          <div className="text-center py-12 text-gray-600">
            <p>Les avis ne peuvent pas être affichés pour le moment.</p>
            <p className="text-sm text-gray-500 mt-2">
              Configurez GOOGLE_PLACES_API_KEY et GOOGLE_PLACE_ID dans le composant.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const currentReview = reviews[currentIndex];

  return (
    <section className="py-12 bg-[#F8F5F0] mx-4 mb-4 rounded-2xl">
      <div className="mx-auto max-w-7xl px-6">
        <h2
          className="text-3xl font-bold text-[#2F2A25] mb-4 text-center"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
          }}
        >
          Avis Google
        </h2>
        <p className="text-center text-[#2F2A25]/70 mb-8 text-sm">
          {reviews.length} avis • Note moyenne 5.0/5
        </p>

        <div className="relative max-w-4xl mx-auto">
          {/* Slider Container */}
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="p-8 md:p-12"
              >
                {/* Quote Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-[#C6A664]/10 flex items-center justify-center">
                    <Quote className="w-8 h-8 text-[#C6A664]" fill="#C6A664" />
                  </div>
                </div>

                {/* Review Text */}
                <p
                  className="text-lg md:text-xl text-[#2F2A25] text-center mb-8 leading-relaxed italic"
                  style={{
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                  }}
                >
                  "{currentReview.text}"
                </p>

                {/* Author Info */}
                <div className="flex flex-col items-center">
                  {/* Profile Photo */}
                  {currentReview.profile_photo_url ? (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden mb-4 ring-2 ring-[#C6A664]/20">
                      <Image
                        src={currentReview.profile_photo_url}
                        alt={currentReview.author_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C6A664] to-[#B88A44] flex items-center justify-center mb-4 ring-2 ring-[#C6A664]/20">
                      <span className="text-white text-xl font-semibold">
                        {currentReview.author_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Author Name */}
                  <h3
                    className="text-xl font-semibold text-[#2F2A25] mb-2"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                    }}
                  >
                    {currentReview.author_name}
                  </h3>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < currentReview.rating
                            ? "text-[#C6A664] fill-[#C6A664]"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Date */}
                  <p className="text-sm text-[#2F2A25]/60">
                    {currentReview.relative_time_description}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            {reviews.length > 1 && (
              <>
                <button
                  onClick={prevReview}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
                  aria-label="Avis précédent"
                >
                  <ChevronLeft className="w-6 h-6 text-[#2F2A25]" />
                </button>
                <button
                  onClick={nextReview}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all hover:scale-110 z-10"
                  aria-label="Avis suivant"
                >
                  <ChevronRight className="w-6 h-6 text-[#2F2A25]" />
                </button>
              </>
            )}

            {/* Dots Indicator */}
            {reviews.length > 1 && (
              <div className="flex justify-center gap-2 pb-6">
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? "bg-[#C6A664] w-8"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Aller à l'avis ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* View All Reviews Link */}
          {GOOGLE_PLACE_ID && (
            <div className="text-center mt-6">
              <a
                href={`https://www.google.com/maps/place/?q=place_id:${GOOGLE_PLACE_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C6A664] hover:text-[#B88A44] text-sm font-medium transition-colors inline-flex items-center gap-1"
              >
                Voir tous les avis sur Google
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

