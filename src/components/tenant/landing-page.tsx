'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenant/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface LandingPageProps {
  tenant: TenantConfig;
  branding: {
    background_color?: string;
    text_primary_color?: string;
    text_secondary_color?: string;
    accent_color?: string;
  } | null;
}

export function LandingPage({ tenant, branding }: LandingPageProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup-email-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Une erreur est survenue');
        setIsLoading(false);
        return;
      }

      toast.success('Un email de confirmation a été envoyé !');
      router.push('/signup/check-email');
    } catch (error) {
      console.error('[LandingPage] Signup error:', error);
      toast.error('Une erreur est survenue. Réessayez plus tard.');
      setIsLoading(false);
    }
  };

  const bgColor = branding?.background_color || '#000000';
  const textColor = branding?.text_primary_color || '#ffffff';
  const accentColor = branding?.accent_color || '#e50914';
  const secondaryTextColor = branding?.text_secondary_color || '#b3b3b3';

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {/* Hero Section Style Netflix */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-4xl w-full text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            {tenant.name}
          </h1>
          
          <p className="text-xl md:text-2xl mb-4" style={{ color: secondaryTextColor }}>
            {tenant.features.catalog && 'Accédez à notre catalogue complet de formations'}
            {tenant.features.beyondCare && 'Suivez votre bien-être mental avec des outils intelligents'}
            {tenant.features.beyondNote && 'Transformez vos documents avec l\'IA'}
          </p>
          
          <p className="text-lg mb-12" style={{ color: secondaryTextColor }}>
            Commencez dès aujourd'hui. Sans engagement.
          </p>
          
          {/* Bouton Mon compte pour les utilisateurs déjà inscrits */}
          <div className="mb-8">
            <Link href="/dashboard/catalogue/account">
              <Button
                type="button"
                variant="outline"
                className="px-6 py-3 text-base font-medium rounded-full border-2"
                style={{ 
                  borderColor: accentColor,
                  color: accentColor,
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = accentColor;
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = accentColor;
                }}
              >
                <User className="mr-2 h-4 w-4" />
                Mon compte
              </Button>
            </Link>
          </div>
          
          <form onSubmit={handleSignup} className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre adresse email"
              className="flex-1 px-6 py-4 text-lg bg-white/10 border-white/20 text-white placeholder-white/60 focus:bg-white/15"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
              }}
              required
              disabled={isLoading}
            />
            <Button
              type="submit"
              className="px-8 py-4 text-lg font-semibold whitespace-nowrap"
              style={{ 
                backgroundColor: accentColor,
                color: '#fff',
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Envoi...
                </>
              ) : (
                'Commencer'
              )}
            </Button>
          </form>

          <p className="text-sm mt-6" style={{ color: secondaryTextColor }}>
            En vous inscrivant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </p>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Pourquoi choisir {tenant.name} ?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tenant.features.catalog && (
              <>
                <div className="text-center">
                  <div className="text-4xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold mb-2">Catalogue Complet</h3>
                  <p style={{ color: secondaryTextColor }}>
                    Accédez à des centaines de formations dans tous les domaines
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold mb-2">Apprentissage Personnalisé</h3>
                  <p style={{ color: secondaryTextColor }}>
                    Des parcours adaptés à vos besoins et à votre rythme
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">💡</div>
                  <h3 className="text-xl font-semibold mb-2">Expertise Reconnue</h3>
                  <p style={{ color: secondaryTextColor }}>
                    Des contenus créés par des experts dans leur domaine
                  </p>
                </div>
              </>
            )}
            
            {tenant.features.beyondCare && (
              <>
                <div className="text-center">
                  <div className="text-4xl mb-4">🧠</div>
                  <h3 className="text-xl font-semibold mb-2">Questionnaires Intelligents</h3>
                  <p style={{ color: secondaryTextColor }}>
                    Analysez votre bien-être mental avec des outils validés scientifiquement
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold mb-2">Suivi Personnalisé</h3>
                  <p style={{ color: secondaryTextColor }}>
                    Visualisez vos progrès et recevez des recommandations adaptées
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="text-xl font-semibold mb-2">Confidentialité Totale</h3>
                  <p style={{ color: secondaryTextColor }}>
                    Vos données sont sécurisées et restent privées
                  </p>
                </div>
              </>
            )}
            
            {tenant.features.beyondNote && (
              <>
                <div className="text-center">
                  <div className="text-4xl mb-4">🤖</div>
                  <h3 className="text-xl font-semibold mb-2">IA Avancée</h3>
                  <p style={{ color: secondaryTextColor }}>
                    Transformez vos documents avec l'intelligence artificielle
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-xl font-semibold mb-2">Rapide et Efficace</h3>
                  <p style={{ color: secondaryTextColor }}>
                    Gagnez du temps sur la création de variantes pédagogiques
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-4">💾</div>
                  <h3 className="text-xl font-semibold mb-2">Bibliothèque Personnelle</h3>
                  <p style={{ color: secondaryTextColor }}>
                    Conservez toutes vos transformations pour les réutiliser
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



