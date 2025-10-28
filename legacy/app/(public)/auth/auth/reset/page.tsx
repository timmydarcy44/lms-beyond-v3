"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    if (password !== confirmPassword) {
      setMsg("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) {
        setMsg(error.message);
      } else {
        setMsg("Mot de passe mis à jour avec succès");
        setTimeout(() => router.push("/dashboard"), 2000);
      }
    } catch (error) {
      setMsg("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#121212] p-8 rounded-xl w-full max-w-md border border-gray-800/50">
      <h1 className="text-2xl font-bold text-center mb-6">Nouveau mot de passe</h1>
      
      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <input
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/50"
            required
          />
        </div>
        
        <div>
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/50"
            required
          />
        </div>
        
        {msg && (
          <p className={`text-sm ${msg.includes("succès") ? "text-green-400" : "text-red-400"}`}>
            {msg}
          </p>
        )}
        
        <button
          disabled={loading}
          className="w-full bg-[#635BFF] hover:bg-[#5A52E5] py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Mettre à jour le mot de passe"}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <a href="/login" className="text-sm text-[#635BFF] hover:text-[#5A52E5] transition-colors">
          Retour à la connexion
        </a>
      </div>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="bg-[#121212] p-8 rounded-xl w-full max-w-md border border-gray-800/50">Chargement...</div>}>
      <ResetForm />
    </Suspense>
  );
}
