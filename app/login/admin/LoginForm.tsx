'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

      // Connexion réussie, rediriger DIRECTEMENT vers le dashboard
      toast.success('Connexion réussie !');
      router.replace('/admin/dashboard');

    } catch (error) {
      console.error('Login error:', error);
      setErr('Erreur de connexion');
      setLoading(false);
      toast.error('Erreur de connexion');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
  );
}
