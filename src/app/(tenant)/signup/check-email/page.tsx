import { getTenantFromHeaders } from '@/lib/tenant/detection-server';
import { Mail } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function CheckEmailPage() {
  const tenant = await getTenantFromHeaders();

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ 
      backgroundColor: '#000000',
      color: '#ffffff',
    }}>
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full p-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            <Mail className="h-12 w-12" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">
          Vérifiez votre email
        </h1>
        
        <p className="text-lg mb-8" style={{ color: '#b3b3b3' }}>
          Nous avons envoyé un lien de confirmation à votre adresse email.
          Cliquez sur le lien dans l'email pour définir votre mot de passe et activer votre compte.
        </p>
        
        <div className="space-y-4">
          <p className="text-sm" style={{ color: '#b3b3b3' }}>
            Vous n'avez pas reçu l'email ? Vérifiez votre dossier spam ou{' '}
            <Link href="/signup" className="underline hover:no-underline">
              réessayez
            </Link>
          </p>
          
          <Link 
            href="/login"
            className="inline-block text-sm underline hover:no-underline"
            style={{ color: '#b3b3b3' }}
          >
            Déjà un compte ? Connectez-vous
          </Link>
        </div>
      </div>
    </div>
  );
}

