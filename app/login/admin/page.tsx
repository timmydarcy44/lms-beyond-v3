'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Organization {
  id: string;
  slug: string;
  name: string;
}

export default function LoginAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const router = useRouter();

  // Vérifier si déjà connecté au chargement
  useEffect(() => {
    const checkSession = async () => {
      const sb = supabaseBrowser();
      const { data: { session } } = await sb.auth.getSession();
      
      if (session?.user) {
        console.log('🔍 LoginAdmin: User already authenticated, checking organizations...');
        try {
          const res = await fetch('/api/diag/whoami', { cache: 'no-store' });
          const json = await res.json();
          
          if (json.user_present && json.memberships?.length > 0) {
            if (json.memberships.length === 1) {
              // Une seule org, rediriger directement
              router.replace(`/admin/${json.memberships[0].slug}`);
            } else {
              // Plusieurs orgs, montrer le sélecteur
              setOrganizations(json.memberships.map((m: any) => ({
                id: m.org_id,
                slug: m.slug,
                name: m.name
              })));
              setShowOrgSelector(true);
            }
          }
        } catch (error) {
          console.error('🔍 LoginAdmin: Error checking organizations:', error);
        }
      }
    };

    checkSession();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const sb = supabaseBrowser();
      const { data: { user }, error } = await sb.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error || !user) {
        setErr('Identifiants invalides');
        setLoading(false);
        toast.error('Identifiants invalides');
        return;
      }

      console.log(`🔍 LoginAdmin: User ${user.email} authenticated, checking organizations...`);

      // Vérifier les organisations côté serveur
      const res = await fetch('/api/diag/whoami', { cache: 'no-store' });
      const json = await res.json();

      if (!json.user_present || !json.memberships?.length) {
        setErr('Aucune organisation associée à ce compte.');
        setLoading(false);
        toast.error('Aucune organisation associée à ce compte');
        return;
      }

      if (json.memberships.length === 1) {
        // Une seule org, rediriger directement
        console.log(`🔍 LoginAdmin: Single org ${json.memberships[0].slug}, redirecting...`);
        toast.success(`Connexion réussie ! Redirection vers ${json.memberships[0].name}...`);
        router.replace(`/admin/${json.memberships[0].slug}`);
      } else {
        // Plusieurs orgs, montrer le sélecteur
        console.log(`🔍 LoginAdmin: Multiple orgs (${json.memberships.length}), showing selector...`);
        setOrganizations(json.memberships.map((m: any) => ({
          id: m.org_id,
          slug: m.slug,
          name: m.name
        })));
        setShowOrgSelector(true);
        setLoading(false);
        toast.success('Connexion réussie ! Sélectionnez votre organisation...');
      }

    } catch (error) {
      console.error('🔍 LoginAdmin: Login error:', error);
      setErr('Erreur de connexion');
      setLoading(false);
      toast.error('Erreur de connexion');
    }
  }

  const handleOrgSelect = () => {
    if (!selectedOrg) return;
    
    const org = organizations.find(o => o.id === selectedOrg);
    if (org) {
      console.log(`🔍 LoginAdmin: Selected org ${org.slug}, redirecting...`);
      toast.success(`Redirection vers ${org.name}...`);
      router.replace(`/admin/${org.slug}`);
    }
  };

  if (showOrgSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto glass p-8 rounded-2xl space-y-6 w-full">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-iris-grad mb-2">Sélectionner une organisation</h1>
            <p className="text-white/70">Vous avez accès à plusieurs organisations</p>
          </div>
          
          <div className="space-y-3">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => setSelectedOrg(org.id)}
                className={`w-full p-4 rounded-xl transition-colors text-left ${
                  selectedOrg === org.id 
                    ? 'bg-iris-500/20 border-2 border-iris-400' 
                    : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                }`}
              >
                <h3 className="font-semibold text-white">{org.name}</h3>
                <p className="text-sm text-white/70">{org.slug}</p>
              </button>
            ))}
          </div>

          <button 
            onClick={handleOrgSelect}
            disabled={!selectedOrg}
            className="btn-cta-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="max-w-sm mx-auto glass p-8 rounded-2xl space-y-6 w-full">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-iris-grad mb-2">Admin</h1>
          <p className="text-white/70">Connexion à l'espace administrateur</p>
        </div>
        
        <div className="space-y-4">
          <input 
            className="bg-white/5 border border-white/10 rounded-xl h-12 w-full px-4 text-white placeholder-white/50 focus:border-iris-400 focus:outline-none transition-colors" 
            placeholder="Email" 
            type="email"
            value={email} 
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input 
            className="bg-white/5 border border-white/10 rounded-xl h-12 w-full px-4 text-white placeholder-white/50 focus:border-iris-400 focus:outline-none transition-colors" 
            type="password" 
            placeholder="Mot de passe" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        {err && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
            {err}
          </div>
        )}

        <button 
          disabled={loading} 
          className="btn-cta-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>

        <div className="text-center">
          <p className="text-white/50 text-sm">
            Pas encore de compte ?{' '}
            <a href="/debug-create-admin" className="text-iris-400 hover:text-iris-300 transition-colors">
              Créer un admin
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}