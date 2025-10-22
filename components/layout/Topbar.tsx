'use client';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function Topbar() {
  const sb = supabaseBrowser();
  const signOut = async () => {
    await sb.auth.signOut();
    location.href = '/login/admin';
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center border-b border-white/10 bg-[#252525]/70 backdrop-blur-md">
      <div className="flex w-full items-center justify-between px-6">
        <h1 className="text-base font-semibold text-iris-grad">Administration</h1>
        <div className="flex items-center gap-3">
          <button onClick={signOut} className="rounded-xl px-3 h-9 bg-white/10 hover:bg-white/20 text-sm">
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}