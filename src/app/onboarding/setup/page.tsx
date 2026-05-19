"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Rocket, Upload } from "lucide-react";

export default function WorkspaceSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    timeoutRef.current = setTimeout(() => {
      router.push("/onboarding/invite");
    }, 2000);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#020617] px-6 text-white">
      <div className="absolute top-10 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold">B</div>
        <span className="text-xl font-bold tracking-tight">
          BEYOND <span className="text-indigo-500">CENTER</span>
        </span>
      </div>

      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        {loading ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <h2 className="mb-2 text-2xl font-bold text-indigo-400">Création de votre espace...</h2>
            <p className="text-sm text-gray-500">Nous préparons vos outils de diagnostic.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-bold">Créez votre espace</h1>
              <p className="text-gray-400">Quelques secondes pour configurer Beyond pour votre équipe.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-gray-500">
                  Nom de l&apos;entreprise
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input
                    required
                    type="text"
                    name="company"
                    placeholder="Ex: Acme Corp"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 outline-none transition-all focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-center text-xs font-bold uppercase tracking-widest text-gray-500">
                  Logo (Optionnel)
                </label>
                <div className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 p-8 transition-all hover:border-indigo-500/50">
                  <Upload className="mb-2 h-8 w-8 text-gray-600 transition-all group-hover:text-indigo-400" />
                  <span className="text-xs text-gray-500">Glissez ou cliquez pour uploader</span>
                </div>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 font-bold shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500"
              >
                Lancer mon workspace <Rocket size={18} aria-hidden />
              </button>
            </form>
          </>
        )}
      </div>

      <div className="mt-12 flex gap-2">
        <div className="h-1.5 w-12 rounded-full bg-indigo-500" />
        <div className="h-1.5 w-12 rounded-full bg-white/10" />
        <div className="h-1.5 w-12 rounded-full bg-white/10" />
        <div className="h-1.5 w-12 rounded-full bg-white/10" />
      </div>
    </div>
  );
}
