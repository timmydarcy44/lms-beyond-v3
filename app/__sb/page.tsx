'use client';
import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/browser';

export default function SBPage() {
  const [msg, setMsg] = useState('Test en cours…');
  useEffect(() => {
    const sb = getBrowserClient();
    if (!sb) { setMsg('Env Supabase manquantes'); return; }
    sb.auth.getSession()
      .then(({ data, error }) => {
        if (error) setMsg('Erreur auth: ' + error.message);
        else setMsg('Client OK — session ' + (data.session ? 'présente' : 'absente'));
      })
      .catch(e => setMsg('Erreur: ' + e.message));
  }, []);
  return (
    <main style={{ padding: 24 }}>
      <h1>🔌 Test Supabase (client)</h1>
      <p>{msg}</p>
    </main>
  );
}

