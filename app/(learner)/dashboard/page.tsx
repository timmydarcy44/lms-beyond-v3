'use client';

import { Hero } from "@/components/cine/Hero";
import { Rail } from "@/components/cine/Rail";
import { CardPoster } from "@/components/cine/CardPoster";

// Mock data pour la démo - à remplacer par des vraies données
const mockData = {
  featuredPathway: {
    id: "1",
    title: "Formation React Avancée",
    description: "Maîtrisez React avec des concepts avancés, hooks personnalisés, et optimisations de performance.",
    coverUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cce?w=800&h=600&fit=crop",
    cta: "Commencer maintenant"
  },
  continueLearning: [
    {
      id: "2",
      title: "JavaScript ES6+",
      subtitle: "Chapitre 3/8",
      coverUrl: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=600&fit=crop"
    },
    {
      id: "3",
      title: "TypeScript Fundamentals",
      subtitle: "Chapitre 1/6",
      coverUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=600&fit=crop"
    }
  ],
  myPathways: [
    {
      id: "4",
      title: "Développement Web Moderne",
      subtitle: "En cours",
      coverUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=600&fit=crop"
    },
    {
      id: "5",
      title: "Node.js Backend",
      subtitle: "Terminé",
      coverUrl: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=600&fit=crop"
    }
  ],
  suggestedFormations: [
    {
      id: "6",
      title: "Vue.js 3",
      subtitle: "Nouveau",
      coverUrl: "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=400&h=600&fit=crop"
    },
    {
      id: "7",
      title: "Python Data Science",
      subtitle: "Populaire",
      coverUrl: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=600&fit=crop"
    }
  ]
};

export default function LearnerDashboard() {
  const handlePathwayClick = (id: string) => {
    // Navigation vers le parcours
    console.log(`Navigate to pathway ${id}`);
  };

  const handleHeroCta = () => {
    handlePathwayClick(mockData.featuredPathway.id);
  };

  return (
    <div className="min-h-screen bg-bg">
      <div className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <Hero
          title={mockData.featuredPathway.title}
          description={mockData.featuredPathway.description}
          coverUrl={mockData.featuredPathway.coverUrl}
          cta={mockData.featuredPathway.cta}
          onCta={handleHeroCta}
        />

        {/* Continue Learning Rail */}
        <Rail title="Reprendre">
          {mockData.continueLearning.map((item) => (
            <CardPoster
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              coverUrl={item.coverUrl}
              onClick={() => handlePathwayClick(item.id)}
            />
          ))}
        </Rail>

        {/* My Pathways Rail */}
        <Rail title="Mes parcours">
          {mockData.myPathways.map((item) => (
            <CardPoster
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              coverUrl={item.coverUrl}
              onClick={() => handlePathwayClick(item.id)}
            />
          ))}
        </Rail>

        {/* Suggested Formations Rail */}
        <Rail title="Formations proposées">
          {mockData.suggestedFormations.map((item) => (
            <CardPoster
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              coverUrl={item.coverUrl}
              onClick={() => handlePathwayClick(item.id)}
            />
          ))}
        </Rail>
      </div>
    </div>
  );
}
