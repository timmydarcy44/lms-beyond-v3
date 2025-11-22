'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from '@/components/providers/supabase-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useSupabase();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    // Vérifier si on a un token dans l'URL (depuis l'email)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Pas de session, peut-être qu'on vient de l'email
        // Vérifier les hash params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (accessToken && type === 'recovery') {
          // On a un token de récupération, on peut continuer
          setIsVerifying(false);
        } else {
          toast.error('Lien invalide ou expiré');
          router.push('/login');
        }
      } else {
        setIsVerifying(false);
      }
    };

    checkSession();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);

    try {
      // Mettre à jour le mot de passe
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message || 'Erreur lors de la définition du mot de passe');
        setIsLoading(false);
        return;
      }

      toast.success('Mot de passe défini avec succès !');
      
      // Rediriger vers le dashboard ou la page d'abonnement
      const tenant = searchParams.get('tenant');
      router.push(`/dashboard?setup=complete&tenant=${tenant || 'beyond-noschool'}`);
    } catch (error) {
      console.error('[SetPasswordPage] Error:', error);
      toast.error('Une erreur est survenue');
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ 
        backgroundColor: '#000000',
        color: '#ffffff',
      }}>
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ 
      backgroundColor: '#000000',
      color: '#ffffff',
    }}>
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold mb-2 text-center">
          Définir votre mot de passe
        </h1>
        
        <p className="text-center mb-8" style={{ color: '#b3b3b3' }}>
          Choisissez un mot de passe sécurisé pour votre compte
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Mot de passe
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
              className="w-full px-4 py-3 bg-white/10 border-white/20 text-white placeholder-white/60"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
              Confirmer le mot de passe
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Répétez le mot de passe"
              className="w-full px-4 py-3 bg-white/10 border-white/20 text-white placeholder-white/60"
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full py-3"
            style={{ backgroundColor: '#e50914' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Définition en cours...
              </>
            ) : (
              'Définir le mot de passe'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ 
        backgroundColor: '#000000',
        color: '#ffffff',
      }}>
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <SetPasswordForm />
    </Suspense>
  );
}

