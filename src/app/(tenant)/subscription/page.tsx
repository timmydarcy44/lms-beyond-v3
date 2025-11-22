'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getTenantFromCookies } from '@/lib/tenant/detection-client';
import { TenantConfig } from '@/lib/tenant/config';

export default function SubscriptionPage() {
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const detectedTenant = getTenantFromCookies();
    if (!detectedTenant) {
      router.push('/');
      return;
    }
    setTenant(detectedTenant);
  }, [router]);

  const handleSubscribe = async () => {
    if (!tenant) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Erreur lors de la création de l\'abonnement');
        setIsLoading(false);
        return;
      }

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('URL de paiement non disponible');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('[SubscriptionPage] Error:', error);
      toast.error('Une erreur est survenue');
      setIsLoading(false);
    }
  };

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        backgroundColor: '#000000',
        color: '#ffffff',
      }}>
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const monthlyPrice = tenant.subscriptionPlans.monthly;
  const yearlyPrice = tenant.subscriptionPlans.yearly;
  const yearlyMonthlyEquivalent = yearlyPrice / 12;
  const savings = ((monthlyPrice * 12) - yearlyPrice).toFixed(2);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20" style={{ 
      backgroundColor: '#000000',
      color: '#ffffff',
    }}>
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-4">
          Choisissez votre abonnement
        </h1>
        
        <p className="text-center mb-12" style={{ color: '#b3b3b3' }}>
          Accédez à {tenant.name} dès maintenant
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Plan Mensuel */}
          <div 
            className={`p-8 rounded-lg border-2 cursor-pointer transition-all ${
              selectedPlan === 'monthly' 
                ? 'border-red-600 bg-red-600/10' 
                : 'border-white/20 bg-white/5 hover:border-white/40'
            }`}
            onClick={() => setSelectedPlan('monthly')}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Mensuel</h3>
              {selectedPlan === 'monthly' && (
                <Check className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold">{monthlyPrice.toFixed(2)}€</span>
              <span className="text-lg" style={{ color: '#b3b3b3' }}>/mois</span>
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-green-500" />
                <span>Accès complet</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-green-500" />
                <span>Résiliable à tout moment</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-green-500" />
                <span>Sans engagement</span>
              </li>
            </ul>
          </div>

          {/* Plan Annuel */}
          <div 
            className={`p-8 rounded-lg border-2 cursor-pointer transition-all relative ${
              selectedPlan === 'yearly' 
                ? 'border-red-600 bg-red-600/10' 
                : 'border-white/20 bg-white/5 hover:border-white/40'
            }`}
            onClick={() => setSelectedPlan('yearly')}
          >
            <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
              ÉCONOMISEZ {savings}€
            </div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">Annuel</h3>
              {selectedPlan === 'yearly' && (
                <Check className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div className="mb-2">
              <span className="text-4xl font-bold">{yearlyPrice.toFixed(2)}€</span>
              <span className="text-lg" style={{ color: '#b3b3b3' }}>/an</span>
            </div>
            <div className="mb-4 text-sm" style={{ color: '#b3b3b3' }}>
              Soit {yearlyMonthlyEquivalent.toFixed(2)}€/mois
            </div>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-green-500" />
                <span>Accès complet</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-green-500" />
                <span>Économisez {savings}€ par an</span>
              </li>
              <li className="flex items-center">
                <Check className="h-5 w-5 mr-2 text-green-500" />
                <span>Paiement unique</span>
              </li>
            </ul>
          </div>
        </div>

        <Button
          onClick={handleSubscribe}
          className="w-full py-6 text-lg font-semibold"
          style={{ backgroundColor: '#e50914' }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Redirection vers le paiement...
            </>
          ) : (
            `S'abonner - ${selectedPlan === 'monthly' ? `${monthlyPrice.toFixed(2)}€/mois` : `${yearlyPrice.toFixed(2)}€/an`}`
          )}
        </Button>

        <p className="text-center mt-6 text-sm" style={{ color: '#b3b3b3' }}>
          Paiement sécurisé par Stripe. Résiliation possible à tout moment.
        </p>
      </div>
    </div>
  );
}

