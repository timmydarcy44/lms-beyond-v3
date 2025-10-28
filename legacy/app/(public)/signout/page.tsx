"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function SignOutPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function signOut() {
      await supabase.auth.signOut();
      router.push("/login");
    }
    signOut();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-[#0b0f14] text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Déconnexion en cours...</h1>
        <p className="text-white/60">Vous allez être redirigé vers la page de connexion.</p>
      </div>
    </div>
  );
}
