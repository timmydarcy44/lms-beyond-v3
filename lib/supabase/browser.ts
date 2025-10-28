'use client';
import { createBrowserClient } from '@supabase/supabase-js';

export function getBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    console.warn('Supabase env manquantes');
    return null as any;
  }
  return createBrowserClient(url, anon);
}

