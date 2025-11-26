"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Play, SkipBack, SkipForward, RotateCcw, RotateCw } from "lucide-react";
import { env } from "@/lib/env";

type PodcastEpisode = {
  id: string;
  title: string;
  categories: string;
  date: string;
  coverImage: string;
  duration?: string;
  audioUrl?: string;
};

// Fonction pour construire l'URL Supabase Storage
function getSupabaseStorageUrl(bucket: string, path: string): string {
  const supabaseUrl = 
    env.supabaseUrl || 
    (typeof window !== 'undefined' ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL : undefined) ||
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined);
  
  if (!supabaseUrl) {
    return "";
  }
  
  const encodedBucket = encodeURIComponent(bucket);
  const pathParts = path.split('/');
  const encodedPath = pathParts.map(part => encodeURIComponent(part)).join('/');
  
  return `${supabaseUrl}/storage/v1/object/public/${encodedBucket}/${encodedPath}`;
}

// Données de démonstration - à remplacer par de vraies données
const podcastEpisodes: PodcastEpisode[] = [
  {
    id: "1",
    title: "Développement des compétences : les clés du succès",
    categories: "FORMATION, LEADERSHIP",
    date: "JAN 15, 2025",
    coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop",
    duration: "45:30",
    audioUrl: getSupabaseStorageUrl("center", "Podcast 1.m4a"),
  },
  {
    id: "2",
    title: "L'accompagnement psychopédagogique en entreprise",
    categories: "PSYCHOPÉDAGOGIE, BUSINESS",
    date: "JAN 10, 2025",
    coverImage: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop",
    duration: "38:15",
  },
  {
    id: "3",
    title: "Certifications professionnelles : comment s'y préparer",
    categories: "FORMATION, CERTIFICATION",
    date: "JAN 05, 2025",
    coverImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
    duration: "52:20",
  },
  {
    id: "4",
    title: "Soft skills : l'intelligence émotionnelle au travail",
    categories: "DÉVELOPPEMENT PERSONNEL, LEADERSHIP",
    date: "DEC 28, 2024",
    coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop",
    duration: "41:10",
  },
  {
    id: "5",
    title: "Le futur de la formation professionnelle",
    categories: "FORMATION, INNOVATION",
    date: "DEC 20, 2024",
    coverImage: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2073&auto=format&fit=crop",
    duration: "48:45",
  },
  {
    id: "6",
    title: "Réseau et insertion professionnelle",
    categories: "CARRÈRE, NETWORKING",
    date: "DEC 15, 2024",
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
    duration: "35:30",
  },
];

export function PodcastsSection() {
  const [currentEpisode, setCurrentEpisode] = useState<PodcastEpisode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const blue = "#006CFF";
  const white = "#FFFFFF";
  const black = "#000000";

  const handlePlayEpisode = (episode: PodcastEpisode) => {
    if (audioRef.current) {
      // Si on change d'épisode, arrêter la lecture en cours
      if (currentEpisode?.id !== episode.id) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }

    setCurrentEpisode(episode);
    
    if (audioRef.current && episode.audioUrl) {
      // Charger la nouvelle source
      audioRef.current.src = episode.audioUrl;
      
      // Attendre que les métadonnées soient chargées avant de jouer
      const handleCanPlay = () => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              // Ignorer les erreurs d'interruption (AbortError)
              if (error.name !== 'AbortError') {
                console.error("Error playing audio:", error);
              }
            });
          // Retirer l'écouteur après utilisation
          audioRef.current?.removeEventListener('canplay', handleCanPlay);
        }
      };

      audioRef.current.addEventListener('canplay', handleCanPlay);
      audioRef.current.load();
    }
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.error("Error playing audio:", error);
        });
      }
    }
  };

  const handleSkipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 30);
    }
  };

  const handleSkipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 30);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      audioRef.current.currentTime = percentage * duration;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("ended", handleEnded);

      return () => {
        audio.removeEventListener("timeupdate", handleTimeUpdate);
        audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audio.removeEventListener("ended", handleEnded);
      };
    }
  }, [currentEpisode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
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
            className="text-6xl md:text-7xl font-light mb-6 leading-[1.05] tracking-tight text-white"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              letterSpacing: '-0.03em',
              fontWeight: 300
            }}
          >
            Podcasts Beyond Center
          </h2>
          <p 
            className="text-xl text-white/70 font-light max-w-2xl mx-auto"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
            }}
          >
            Écoutez nos experts partager leurs connaissances et expériences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Section gauche : Épisode en cours */}
          <div className="lg:col-span-2">
            {currentEpisode ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1A1A1A] rounded-3xl p-8 border border-white/10"
              >
                {/* Cover Art */}
                <div className="relative w-full aspect-square max-w-md mx-auto mb-8 rounded-2xl overflow-hidden">
                  <Image
                    src={currentEpisode.coverImage}
                    alt={currentEpisode.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Episode Details */}
                <div className="text-center mb-8">
                  <p 
                    className="text-sm text-white/60 font-light mb-3 uppercase tracking-wider"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    {currentEpisode.categories} • {currentEpisode.date}
                  </p>
                  <h3 
                    className="text-3xl md:text-4xl font-light mb-4 text-white leading-tight"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {currentEpisode.title}
                  </h3>
                </div>

                {/* Audio Player Controls */}
                <div className="space-y-6">
                  {/* Hidden Audio Element */}
                  <audio
                    ref={audioRef}
                    preload="metadata"
                    style={{ display: "none" }}
                  />

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div 
                      className="relative h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                      onClick={handleProgressBarClick}
                    >
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-[#006CFF]"
                        style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
                        initial={{ width: 0 }}
                        animate={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-white/60 font-light">
                      <span>{formatTime(currentTime)}</span>
                      <span>{duration > 0 ? formatTime(duration) : (currentEpisode.duration || "0:00")}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <button
                      className="p-3 rounded-full hover:bg-white/10 transition-colors"
                      aria-label="Précédent"
                      disabled
                    >
                      <SkipBack className="h-5 w-5 text-white/50" />
                    </button>
                    <button
                      onClick={handleSkipBackward}
                      className="p-3 rounded-full hover:bg-white/10 transition-colors"
                      aria-label="Reculer 30 secondes"
                    >
                      <div className="relative">
                        <RotateCcw className="h-6 w-6 text-white" />
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-white font-light">30</span>
                      </div>
                    </button>
                    <button
                      onClick={handlePlayPause}
                      className="p-4 rounded-full bg-[#006CFF] hover:bg-[#0052CC] transition-colors flex items-center justify-center"
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? (
                        <div className="flex gap-1 items-center justify-center h-8">
                          <div className="w-1 h-6 bg-white rounded-full" />
                          <div className="w-1 h-6 bg-white rounded-full" />
                        </div>
                      ) : (
                        <Play 
                          className="h-8 w-8 text-white"
                          style={{ transform: 'translateX(2px)' }}
                        />
                      )}
                    </button>
                    <button
                      onClick={handleSkipForward}
                      className="p-3 rounded-full hover:bg-white/10 transition-colors"
                      aria-label="Avancer 30 secondes"
                    >
                      <div className="relative">
                        <RotateCw className="h-6 w-6 text-white" />
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] text-white font-light">30</span>
                      </div>
                    </button>
                    <button
                      className="p-3 rounded-full hover:bg-white/10 transition-colors"
                      aria-label="Suivant"
                      disabled
                    >
                      <SkipForward className="h-5 w-5 text-white/50" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-[#1A1A1A] rounded-3xl p-16 border border-white/10 flex items-center justify-center min-h-[600px]">
                <div className="text-center">
                  <div 
                    className="w-24 h-24 rounded-full bg-[#006CFF]/20 flex items-center justify-center mx-auto mb-6"
                  >
                    <Play className="h-12 w-12 text-[#006CFF]" style={{ transform: 'translateX(4px)' }} />
                  </div>
                  <p 
                    className="text-white/60 font-light text-lg"
                    style={{ 
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                    }}
                  >
                    Sélectionnez un épisode pour commencer
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section droite : Liste des épisodes */}
          <div className="space-y-4">
            {podcastEpisodes.map((episode, index) => (
              <motion.button
                key={episode.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => handlePlayEpisode(episode)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                  currentEpisode?.id === episode.id
                    ? "border-[#006CFF] bg-[#006CFF]/10"
                    : "border-white/10 bg-[#1A1A1A] hover:border-white/20 hover:bg-white/5"
                }`}
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={episode.coverImage}
                      alt={episode.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Episode Info */}
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-xs text-white/60 font-light mb-1 uppercase tracking-wider truncate"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                      }}
                    >
                      {episode.categories} • {episode.date}
                    </p>
                    <h4 
                      className="text-sm font-light text-white mb-2 line-clamp-2"
                      style={{ 
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
                        letterSpacing: '-0.01em'
                      }}
                    >
                      {episode.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[#006CFF]">
                      <Play className="h-3 w-3" />
                      <span 
                        className="text-xs font-light"
                        style={{ 
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif'
                        }}
                      >
                        Écouter
                      </span>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

