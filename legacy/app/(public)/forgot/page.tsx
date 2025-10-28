"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPage() {
  const supabase = createClient();
  
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset`,
      });
      
      if (error) {
        setMsg(error.message);
      } else {
        setMsg("Vérifiez votre email pour réinitialiser votre mot de passe");
      }
    } catch (error) {
      setMsg("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#121212] p-8 rounded-xl w-full max-w-md border border-gray-800/50">
      <h1 className="text-2xl font-bold text-center mb-6">Mot de passe oublié</h1>
      
      <form onSubmit={handleForgot} className="space-y-4">
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#635BFF]/50"
            required
          />
        </div>
        
        {msg && (
          <p className={`text-sm ${msg.includes("Vérifiez") ? "text-green-400" : "text-red-400"}`}>
            {msg}
          </p>
        )}
        
        <button
          disabled={loading}
          className="w-full bg-[#635BFF] hover:bg-[#5A52E5] py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Envoyer le lien de réinitialisation"}
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
