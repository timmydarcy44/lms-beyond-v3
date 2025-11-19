"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Mic, Play, Pause, RotateCcw, TrendingUp, TrendingDown, Users, Heart, Shield, Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
type PerceptionMetric = {
  id: string;
  label: string;
  value: number; // 0-100
  color: string;
  icon: React.ElementType;
};

type Question = {
  id: string;
  text: string;
  answers: {
    id: string;
    text: string;
    impact: Record<string, number>; // impact sur chaque métrique
    feedback?: string;
  }[];
};

// Scénario : Conférence de presse joueur PSG centre de formation
const initialQuestions: Question[] = [
  {
    id: "q1",
    text: "Vous avez fait un grand match, 2 buts pour vous aujourd'hui. Ne vous sentez-vous pas trop seul dans cette équipe ?",
    answers: [
      {
        id: "a1-1",
        text: "Je vous remercie pour les compliments mais je suis juste le finisseur, je marque car mes coéquipiers me mettent dans de bonnes conditions",
        impact: { reputation: 10, empathy: 10, professionalism: 8, humility: 10 },
        feedback: "Excellente réponse ! Vous montrez de l'humilité et reconnaissez le travail d'équipe. Cela renforce votre image professionnelle et votre réputation.",
      },
      {
        id: "a1-2",
        text: "Merci, c'est vrai que c'est difficile mais je suis content d'être le leader de cette équipe",
        impact: { reputation: 3, confidence: 8, empathy: -5, professionalism: -3, humility: -5 },
        feedback: "Réponse qui montre de la confiance mais peut paraître un peu individualiste. Attention à ne pas minimiser le rôle des coéquipiers. Les médias préfèrent les réponses qui valorisent le collectif.",
      },
      {
        id: "a1-3",
        text: "Je préfère ne pas commenter sur l'équipe, je me concentre sur ma performance",
        impact: { reputation: -3, empathy: -8, professionalism: -5, confidence: 2 },
        feedback: "Réponse qui évite la question mais peut être perçue comme un manque d'esprit d'équipe. Les médias apprécient les réponses qui valorisent le collectif et montrent de l'empathie.",
      },
      {
        id: "a1-4",
        text: "Chaque joueur a son rôle. Mes buts sont importants, mais sans mes coéquipiers, rien n'est possible",
        impact: { reputation: 8, empathy: 10, professionalism: 10, humility: 10 },
        feedback: "Réponse parfaite ! Vous montrez de la gratitude envers l'équipe tout en reconnaissant votre contribution. C'est l'équilibre idéal entre confiance et humilité.",
      },
    ],
  },
  {
    id: "q2",
    text: "Comment gérez-vous la pression médiatique en tant que jeune joueur ?",
    answers: [
      {
        id: "a2-1",
        text: "Je me concentre sur mon jeu, le reste suit.",
        impact: { reputation: 8, confidence: 10, professionalism: 5 },
        feedback: "Excellente réponse, montre de la maturité.",
      },
      {
        id: "a2-2",
        text: "C'est difficile, mais j'apprends à vivre avec.",
        impact: { reputation: 2, confidence: -3, empathy: 8 },
        feedback: "Réponse humaine et authentique.",
      },
      {
        id: "a2-3",
        text: "Je ne me préoccupe pas de ça.",
        impact: { reputation: -8, confidence: -5, professionalism: -10 },
        feedback: "Réponse qui peut paraître désinvolte.",
      },
    ],
  },
  {
    id: "q3",
    text: "Que pensez-vous des critiques concernant votre style de jeu ?",
    answers: [
      {
        id: "a3-1",
        text: "J'écoute les conseils et j'essaie de m'améliorer.",
        impact: { reputation: 10, professionalism: 8, humility: 10 },
        feedback: "Réponse exemplaire, montre de l'humilité.",
      },
      {
        id: "a3-2",
        text: "Chacun a son opinion, je reste fidèle à mon style.",
        impact: { reputation: 3, confidence: 5, humility: -5 },
        feedback: "Réponse équilibrée mais un peu fermée.",
      },
      {
        id: "a3-3",
        text: "Je ne les écoute pas vraiment.",
        impact: { reputation: -12, humility: -10, professionalism: -8 },
        feedback: "Réponse qui peut être perçue comme arrogante.",
      },
    ],
  },
  {
    id: "q4",
    text: "On parle beaucoup de votre avenir, avez-vous déjà pensé à quitter le PSG ?",
    answers: [
      {
        id: "a4-1",
        text: "Je suis concentré sur le présent et sur donner le meilleur pour le PSG. C'est ici que je veux progresser.",
        impact: { reputation: 10, professionalism: 10, empathy: 5, humility: 8 },
        feedback: "Excellente réponse ! Vous montrez de la loyauté et de la concentration. Cela renforce votre image professionnelle.",
      },
      {
        id: "a4-2",
        text: "Je ne peux pas me projeter si loin, je vis au jour le jour.",
        impact: { reputation: 2, confidence: -3, professionalism: -5 },
        feedback: "Réponse qui peut paraître peu réfléchie. Les médias apprécient les réponses qui montrent de la maturité et de la vision.",
      },
      {
        id: "a4-3",
        text: "Tout est possible dans le football, je ne ferme aucune porte.",
        impact: { reputation: -5, professionalism: -8, empathy: -3 },
        feedback: "Réponse qui peut être perçue comme peu loyale. Attention à ne pas donner l'impression de chercher ailleurs.",
      },
      {
        id: "a4-4",
        text: "Le PSG m'a tout donné, je dois beaucoup à ce club. Pour l'instant, je suis là à 100%.",
        impact: { reputation: 8, empathy: 10, professionalism: 10, humility: 8 },
        feedback: "Réponse parfaite ! Vous montrez de la gratitude et de l'engagement tout en restant professionnel.",
      },
    ],
  },
  {
    id: "q5",
    text: "Quel message souhaitez-vous transmettre aux jeunes qui rêvent de devenir footballeur professionnel ?",
    answers: [
      {
        id: "a5-1",
        text: "Il faut travailler dur, rester humble et ne jamais abandonner ses rêves. Le travail paie toujours.",
        impact: { reputation: 10, empathy: 10, professionalism: 10, humility: 10 },
        feedback: "Réponse exemplaire ! Vous montrez de la sagesse et de l'empathie. C'est un message inspirant pour les jeunes.",
      },
      {
        id: "a5-2",
        text: "C'est difficile mais si vous avez du talent, ça finira par payer.",
        impact: { reputation: 3, empathy: 5, confidence: 5, humility: -3 },
        feedback: "Réponse qui met l'accent sur le talent plutôt que le travail. Les médias préfèrent les messages qui valorisent l'effort.",
      },
      {
        id: "a5-3",
        text: "Je ne suis pas là pour donner des conseils, chacun doit trouver son chemin.",
        impact: { reputation: -5, empathy: -10, professionalism: -5 },
        feedback: "Réponse qui peut paraître peu généreuse. Les médias apprécient les joueurs qui partagent leur expérience avec les jeunes.",
      },
      {
        id: "a5-4",
        text: "Il faut croire en soi, s'entraîner tous les jours et écouter les conseils de ses entraîneurs.",
        impact: { reputation: 8, empathy: 8, professionalism: 10, humility: 8 },
        feedback: "Bonne réponse ! Vous donnez des conseils constructifs tout en montrant de l'humilité. Message équilibré et inspirant.",
      },
    ],
  },
];

const initialMetrics: PerceptionMetric[] = [
  { id: "reputation", label: "Réputation", value: 50, color: "bg-blue-500", icon: Star },
  { id: "confidence", label: "Confiance", value: 50, color: "bg-purple-500", icon: Shield },
  { id: "empathy", label: "Empathie", value: 50, color: "bg-pink-500", icon: Heart },
  { id: "professionalism", label: "Professionnalisme", value: 50, color: "bg-green-500", icon: Users },
  { id: "humility", label: "Humilité", value: 50, color: "bg-amber-500", icon: TrendingUp },
];

export function MediaTrainingSimulator() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [metrics, setMetrics] = useState<PerceptionMetric[]>(initialMetrics);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<"idle" | "question" | "answer" | "feedback">("idle");
  
  // État pour les vidéos
  const [videos, setVideos] = useState<{
    journalist?: string;
    player?: string;
    background?: string;
  }>({});
  const [videosLoaded, setVideosLoaded] = useState(false);

  const currentQuestion = initialQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === initialQuestions.length - 1;

  // Animation de la scène
  // Charger les vidéos depuis l'API
  useEffect(() => {
    const loadVideos = async () => {
      try {
        // Essayer d'abord avec le scenario_context spécifique
        let response = await fetch("/api/gamification/videos?scenario_context=media-training-psg");
        let videoList = [];
        
        if (response.ok) {
          videoList = await response.json();
          console.log("[media-training-simulator] Videos loaded (with context):", videoList);
        }
        
        // Si aucune vidéo, charger toutes les vidéos actives
        if (videoList.length === 0) {
          response = await fetch("/api/gamification/videos");
          if (response.ok) {
            videoList = await response.json();
            console.log("[media-training-simulator] Videos loaded (all):", videoList);
          }
        }
        
        if (videoList.length > 0) {
          console.log("[media-training-simulator] All videos:", videoList.map((v: any) => ({
            title: v.title,
            storage_path: v.storage_path,
            video_type: v.video_type
          })));
          
          // Chercher d'abord la vidéo "Question 1" (par titre ou storage_path) - recherche plus large
          const question1Video = videoList.find((v: any) => {
            const title = (v.title || "").toLowerCase();
            const path = (v.storage_path || "").toLowerCase();
            // Recherche avec et sans extension
            return title.includes("question 1") || 
                   title.includes("question1") ||
                   title.includes("question-1") ||
                   title === "question 1" ||
                   title === "question 1.mp4" ||
                   title.startsWith("question 1") ||
                   path.includes("question 1") ||
                   path.includes("question1") ||
                   path.includes("question-1") ||
                   path.includes("question 1.mp4") ||
                   path.endsWith("question 1.mp4");
          });
          
          // Prendre la première vidéo de chaque type (ou la plus récente)
          const journalistVideo = videoList.find((v: any) => v.video_type === "journalist");
          const backgroundVideo = videoList.find((v: any) => v.video_type === "background");
          
          // Utiliser UNIQUEMENT "Question 1", pas de fallback vers d'autres vidéos
          const anyPlayerVideo = question1Video || null;
          
          if (question1Video) {
            console.log("[media-training-simulator] ✅ Found 'Question 1' video:", {
              title: question1Video.title,
              path: question1Video.storage_path,
              url: question1Video.public_url,
              video_type: question1Video.video_type
            });
          } else {
            console.warn("[media-training-simulator] ⚠️ 'Question 1' video not found.");
            console.warn("[media-training-simulator] Searched for titles/paths containing: 'question 1', 'question1', 'question-1', 'question 1.mp4'");
            console.warn("[media-training-simulator] Using fallback video:", {
              title: anyPlayerVideo?.title,
              path: anyPlayerVideo?.storage_path,
              video_type: anyPlayerVideo?.video_type
            });
          }
          
          // Fonction pour corriger l'URL si elle contient un placeholder
          const fixUrl = (url: string | undefined, storagePath: string | undefined) => {
            if (!url || !storagePath) return url;
            
            // Si l'URL contient un placeholder, essayer de la reconstruire
            if (url.includes('your_supabase_project_id') || url.includes('YOUR_SUPABASE_PROJECT_ID')) {
              // Extraire le project ID depuis l'URL actuelle si possible
              // Sinon, utiliser l'URL de la vidéo pour extraire le domaine
              const match = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
              if (match && match[1] && match[1] !== 'your_supabase_project_id') {
                const projectId = match[1];
                const bucketName = 'gamification-videos';
                const encodedPath = encodeURIComponent(storagePath);
                return `https://${projectId}.supabase.co/storage/v1/object/public/${bucketName}/${encodedPath}`;
              }
              // Si on ne peut pas extraire, retourner null pour utiliser le fallback
              console.warn("[media-training-simulator] Cannot fix URL with placeholder:", url);
              return null;
            }
            return url;
          };
          
          const playerUrl = fixUrl(
            anyPlayerVideo?.public_url,
            anyPlayerVideo?.storage_path
          );
          
          setVideos({
            journalist: fixUrl(journalistVideo?.public_url, journalistVideo?.storage_path) ?? undefined,
            player: playerUrl ?? undefined,
            background: fixUrl(backgroundVideo?.public_url, backgroundVideo?.storage_path) ?? undefined,
          });
          
          console.log("[media-training-simulator] Videos set:", {
            journalist: journalistVideo?.public_url,
            player: playerUrl,
            background: backgroundVideo?.public_url,
            allVideos: videoList,
          });
        } else {
          console.warn("[media-training-simulator] No videos found in database");
        }
      } catch (error) {
        console.error("[media-training-simulator] Error loading videos:", error);
      } finally {
        setVideosLoaded(true);
      }
    };
    
    loadVideos();
  }, []);

  useEffect(() => {
    if (animationPhase === "idle" && videosLoaded) {
      const timer = setTimeout(() => {
        setAnimationPhase("question");
        setIsPlaying(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [animationPhase, videosLoaded]);

  const handleAnswerSelect = (answerId: string) => {
    if (selectedAnswer || isAnimating) return;

    setSelectedAnswer(answerId);
    setIsAnimating(true);
    setAnimationPhase("answer");

    const answer = currentQuestion.answers.find((a) => a.id === answerId);
    if (!answer) return;

    // Mettre à jour les métriques avec animation
    setTimeout(() => {
      setMetrics((prev) =>
        prev.map((metric) => {
          const change = answer.impact[metric.id] || 0;
          const newValue = Math.max(0, Math.min(100, metric.value + change));
          return { ...metric, value: newValue };
        })
      );
      setShowFeedback(true);
      setAnimationPhase("feedback");
    }, 500);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      // Fin de la simulation
      return;
    }
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsAnimating(false);
    setAnimationPhase("question");
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  const handleReset = () => {
    setCurrentQuestionIndex(0);
    setMetrics(initialMetrics);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsAnimating(false);
    setAnimationPhase("idle");
  };

  const selectedAnswerData = selectedAnswer
    ? currentQuestion.answers.find((a) => a.id === selectedAnswer)
    : null;

  // Afficher un loader pendant le chargement des vidéos
  if (!videosLoaded) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <Card className="border-white/10 bg-white/10 backdrop-blur-md text-white max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mb-4 text-blue-400" />
            <p className="text-white/80 text-lg font-semibold mb-2">Chargement des vidéos...</p>
            <p className="text-white/60 text-sm text-center">Préparation de la simulation</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
      {/* Animation de fond - Effet de mouvement */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Motif de fond animé */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMyIDIgNCA0IDQgOCAwIDQtMiA2LTYgNnMtNi0yLTYtNmMwLTQgMi02IDQtOHoiIGZpbGw9IiMxZTI4M2YiIG9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20 animate-pulse" />
        
        {/* Particules flottantes */}
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/5 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 5 + 3}s`,
              }}
            />
          ))}
        </div>

        {/* Gradient animé */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            isPlaying ? "opacity-100" : "opacity-50"
          )}
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
            animation: isPlaying ? "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
          }}
        />

        {/* Lignes animées */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-shimmer" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-shimmer" style={{ animationDelay: "1s" }} />
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Media Training Simulation</h1>
          <p className="text-white/70">Interview - Joueur PSG Centre de Formation</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Colonne gauche - Métriques de perception */}
          <div className="space-y-4">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Perception du Public
                </h3>
                <div className="space-y-4">
                  {metrics.map((metric) => {
                    const Icon = metric.icon;
                    const change = selectedAnswerData
                      ? selectedAnswerData.impact[metric.id] || 0
                      : 0;
                    const isPositive = change > 0;
                    const isNegative = change < 0;

                    return (
                      <div key={metric.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-white/70" />
                            <span className="text-sm text-white/90">{metric.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAnimating && change !== 0 && (
                              <span
                                className={cn(
                                  "text-xs font-semibold transition-all duration-500",
                                  isPositive ? "text-green-400" : "text-red-400"
                                )}
                              >
                                {isPositive ? "+" : ""}
                                {change}
                              </span>
                            )}
                            <span className="text-sm font-bold text-white w-12 text-right">
                              {Math.round(metric.value)}%
                            </span>
                          </div>
                        </div>
                        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all duration-1000 ease-out",
                              metric.color
                            )}
                            style={{ width: `${metric.value}%` }}
                          />
                          {isAnimating && change !== 0 && (
                            <div
                              className={cn(
                                "absolute top-0 h-full transition-all duration-1000",
                                isPositive ? "bg-green-400/50" : "bg-red-400/50"
                              )}
                              style={{
                                left: `${metric.value - change}%`,
                                width: `${Math.abs(change)}%`,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Indicateur de progression */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>Question</span>
                    <span>
                      {currentQuestionIndex + 1} / {initialQuestions.length}
                    </span>
                  </div>
                  <Progress
                    value={((currentQuestionIndex + 1) / initialQuestions.length) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne centrale - Scène d'interview - Agrandie */}
          <div className="lg:col-span-3">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 overflow-hidden">
              <CardContent className="p-0">
                {/* Scène de conférence de presse style FIFA/EA Sports FC avec modélisation 3D */}
                <div className="relative h-[calc(100vh-200px)] min-h-[800px] bg-gradient-to-b from-white via-gray-50 to-white overflow-hidden">
                  {/* Fond avec grille de logos PSG */}
                  <div className="absolute inset-0 bg-white">
                    {/* Grille de cartes PSG en arrière-plan */}
                    <div className="grid grid-cols-6 gap-2 p-4 h-full opacity-25">
                      {Array.from({ length: 48 }).map((_, i) => (
                        <div
                          key={i}
                          className="relative border-2 border-blue-400 rounded-lg flex flex-col items-center justify-center bg-white p-2 shadow-sm"
                        >
                          {/* Logo PSG dans chaque carte */}
                          <div className="w-full h-full flex flex-col items-center justify-center">
                            <div className="text-blue-600 font-black text-xs mb-1">PSG</div>
                            <div className="w-full h-0.5 bg-red-600 rounded"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Bannière supérieure avec logo PSG */}
                    <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-blue-900 to-blue-800 border-b-2 border-red-600 flex items-center justify-between px-6 shadow-md z-10">
                      <div className="flex items-center gap-3">
                        {/* Logo PSG - Utiliser l'image si disponible, sinon placeholder */}
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-red-600 shadow-lg">
                          <span className="text-blue-900 font-black text-sm">PSG</span>
                        </div>
                        <div className="text-white">
                          <div className="font-bold text-base">Paris Saint-Germain</div>
                          <div className="text-xs text-blue-200">Centre de Formation</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-[10px] font-bold text-gray-800 px-1">
                          EA SPORTS
                        </div>
                        <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-[10px] font-bold text-blue-600 px-1">
                          FC
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Éclairage professionnel - Lumières de scène */}
                  <div className="absolute inset-0 pointer-events-none z-5">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-radial from-white/50 via-white/20 to-transparent blur-3xl" />
                    <div className="absolute top-0 left-1/4 w-80 h-80 bg-gradient-radial from-white/30 to-transparent blur-2xl" />
                    <div className="absolute top-0 right-1/4 w-80 h-80 bg-gradient-radial from-white/30 to-transparent blur-2xl" />
                  </div>

                  {/* Modélisation 3D du personnage - Style FIFA */}
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <div className="relative w-full h-full flex items-end justify-center pb-8">
                      {/* Carte centrale avec modélisation 3D - Agrandie */}
                      <div
                        className={cn(
                          "relative transition-all duration-500 ease-out",
                          animationPhase === "answer" ? "scale-105" : "scale-100"
                        )}
                        style={{
                          perspective: "1000px",
                          transformStyle: "preserve-3d",
                        }}
                      >
                        <div className="relative w-full max-w-4xl h-[calc(100vh-250px)] min-h-[700px] bg-white rounded-xl shadow-2xl border-2 border-gray-200 overflow-hidden">
                          {/* Vidéo du personnage avec effet 3D - Agrandie */}
                          <div 
                            className="relative w-full h-[calc(100%-120px)] min-h-[580px] overflow-hidden"
                            style={{
                              transform: "translateZ(20px)",
                            }}
                          >
                            {videos.player ? (
                              <video
                                src={videos.player}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover object-center"
                                style={{
                                  transform: "scale(1.05)",
                                  filter: "brightness(1.05) contrast(1.1)",
                                }}
                                onLoadedData={() => {
                                  console.log("[media-training-simulator] Video loaded successfully:", videos.player);
                                }}
                                onError={(e) => {
                                  console.error("[media-training-simulator] Video error:", e);
                                  const video = e.currentTarget;
                                  video.style.display = 'none';
                                  const fallback = document.createElement('div');
                                  fallback.className = 'w-full h-full flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-950 text-white text-lg font-bold';
                                  fallback.textContent = 'Joueur PSG';
                                  video.parentElement?.appendChild(fallback);
                                }}
                              />
                            ) : (
                              <img
                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=face&auto=format"
                                alt="Joueur PSG"
                                className="w-full h-full object-cover object-top"
                                style={{
                                  transform: "scale(1.1)",
                                  filter: "brightness(1.05) contrast(1.1)",
                                }}
                                onError={(e) => {
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-b from-blue-900 to-blue-950 text-white text-lg font-bold">Joueur PSG</div>';
                                  }
                                }}
                              />
                            )}
                            
                            {/* Overlay bleu foncé avec ligne rouge - Style modélisation */}
                            <div className="absolute inset-0 pointer-events-none">
                              {/* Overlay bleu foncé sur la partie inférieure */}
                              <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-blue-900/90 via-blue-900/70 to-transparent" />
                              
                              {/* Ligne rouge verticale centrale */}
                              <div className="absolute left-1/2 -translate-x-1/2 top-32 bottom-0 w-1 bg-red-600" />
                              
                              {/* Badge PSG sur la ligne rouge (haut) */}
                              <div className="absolute top-40 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl border-2 border-blue-800 z-10"
                                   style={{ transform: "translateX(-50%) translateZ(30px)" }}>
                                <span className="text-blue-900 font-black text-xs">PSG</span>
                              </div>
                              
                              {/* Badge PSG sur la ligne rouge (milieu) */}
                              <div className="absolute top-56 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-blue-800 z-10"
                                   style={{ transform: "translateX(-50%) translateZ(25px)" }}>
                                <span className="text-blue-900 font-black text-[10px]">PSG</span>
                              </div>
                              
                              {/* Élément noir arrondi avec badge PSG */}
                              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-16 h-12 bg-gray-900 rounded-lg flex items-center justify-center shadow-xl z-10"
                                   style={{ transform: "translateX(-50%) translateZ(20px)" }}>
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                  <span className="text-blue-900 font-black text-[8px]">PSG</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Éclairage 3D sur le visage */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10 pointer-events-none" />
                          </div>
                          
                          {/* Informations en bas de la carte */}
                          <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200">
                            <p className="text-gray-900 font-bold text-xl mb-1">Kylian Mbappé</p>
                            <p className="text-gray-600 text-xs">Centre de Formation PSG</p>
                          </div>
                        </div>
                        
                        {/* Microphones devant - Style FIFA - Agrandis */}
                        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-8 z-30"
                             style={{ transform: "translateZ(40px)" }}>
                          {/* Micro principal */}
                          <div className="relative">
                            <div className="w-14 h-36 bg-gray-900 rounded-full shadow-2xl border-2 border-gray-700">
                              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-8 bg-gray-800 rounded-full border border-gray-600" />
                              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center border border-blue-600">
                                <span className="text-blue-900 font-black text-[9px]">PSG</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Micro secondaire */}
                          <div className="relative">
                            <div className="w-12 h-32 bg-gray-800 rounded-full shadow-xl border-2 border-gray-600">
                              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-14 h-6 bg-gray-700 rounded-full" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Boîte de dialogue style FIFA - En bas de l'écran */}
                  <div
                    className={cn(
                      "absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl transition-all duration-500 z-40",
                      animationPhase === "question" || animationPhase === "answer"
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-4"
                    )}
                  >
                    <div className="bg-gray-900/95 backdrop-blur-md rounded-xl p-6 border-2 border-gray-700 shadow-2xl">
                      {/* Question */}
                      <p className="text-white text-xl font-semibold mb-6 text-center">
                        {currentQuestion.text}
                      </p>

                      {!selectedAnswer && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {currentQuestion.answers.map((answer, index) => (
                            <Button
                              key={answer.id}
                              onClick={() => handleAnswerSelect(answer.id)}
                              disabled={isAnimating}
                              className={cn(
                                "h-auto min-h-[120px] py-4 px-4 text-sm font-medium",
                                "bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-600 hover:to-blue-700",
                                "text-white border-2 border-blue-500/50",
                                "transition-all duration-200 hover:scale-[1.02] hover:shadow-lg",
                                "shadow-md flex flex-col items-center justify-center",
                                "break-words text-center leading-relaxed",
                                "relative group whitespace-normal"
                              )}
                            >
                              <span className="absolute top-2 left-2 text-[10px] font-bold text-blue-200">[{index + 1}]</span>
                              <span className="px-2 leading-relaxed max-w-full">{answer.text}</span>
                            </Button>
                          ))}
                        </div>
                      )}

                      {selectedAnswer && showFeedback && selectedAnswerData && (
                        <div className="space-y-4">
                          <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                            <p className="text-white/90 text-sm">{selectedAnswerData.feedback}</p>
                          </div>
                          {!isLastQuestion && (
                            <Button
                              onClick={handleNext}
                              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                            >
                              Question suivante →
                            </Button>
                          )}
                          {isLastQuestion && (
                            <div className="space-y-3">
                              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-500/30">
                                <p className="text-white font-semibold text-center">
                                  Interview terminée !
                                </p>
                                <p className="text-white/70 text-sm text-center mt-2">
                                  Votre performance a été analysée.
                                </p>
                              </div>
                              <Button
                                onClick={handleReset}
                                variant="outline"
                                className="w-full border-white/20 text-white hover:bg-white/10"
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Recommencer
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Résumé final (affiché à la fin) */}
        {isLastQuestion && selectedAnswer && showFeedback && (
          <Card className="mt-6 bg-white/10 backdrop-blur-md border-white/20">
            <CardContent className="p-6">
              <h3 className="text-white font-semibold mb-4 text-center">
                Résumé de votre Performance
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  const isHigh = metric.value >= 70;
                  const isLow = metric.value <= 30;

                  return (
                    <div
                      key={metric.id}
                      className={cn(
                        "text-center p-4 rounded-lg border",
                        isHigh
                          ? "bg-green-500/20 border-green-500/30"
                          : isLow
                          ? "bg-red-500/20 border-red-500/30"
                          : "bg-white/5 border-white/10"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-8 w-8 mx-auto mb-2",
                          isHigh ? "text-green-400" : isLow ? "text-red-400" : "text-white/60"
                        )}
                      />
                      <p className="text-white/70 text-xs mb-1">{metric.label}</p>
                      <p className="text-white font-bold text-lg">{Math.round(metric.value)}%</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

