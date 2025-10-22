'use client';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch('/api/auth/signout', { method: 'POST' });
        router.replace('/login/admin');
      }}
      className="mt-auto w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 transition"
    >
      Se déconnecter
    </button>
  );
}
