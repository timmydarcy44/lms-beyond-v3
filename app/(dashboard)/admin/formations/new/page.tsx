'use client';
import { useState } from 'react';
import { createFormationAction } from './actions';

export default function NewFormationPage() {
  const [err,setErr]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(null); setLoading(true);
    try { await createFormationAction(new FormData(e.currentTarget)); }
    catch (e:any) { setErr(e?.message || 'Erreur inconnue'); setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 sm:p-6">
      <form onSubmit={onSubmit} className="glass p-4 sm:p-6 rounded-2xl max-w-3xl mx-auto space-y-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-iris-grad">Nouvelle formation</h1>

        <input name="title" placeholder="Titre" required className="h-11 w-full rounded-xl bg-white/5 px-3 text-sm sm:text-base" />
        <textarea name="description" rows={4} placeholder="Description" className="w-full rounded-xl bg-white/5 px-3 py-2 text-sm sm:text-base" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <select name="visibility_mode" className="h-11 rounded-xl bg-white/5 px-3 text-sm sm:text-base">
            <option value="private">Privée</option>
            <option value="catalog_only">Catalogue</option>
            <option value="public">Publique</option>
          </select>
          <select name="reading_mode" className="h-11 rounded-xl bg-white/5 px-3 text-sm sm:text-base">
            <option value="free">Libre</option>
            <option value="linear">Linéaire</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input 
            name="theme" 
            placeholder="Thème (ex: business, management, iris, blush...)" 
            maxLength={64}
            className="h-11 rounded-xl bg-white/5 px-3 text-sm sm:text-base" 
          />
          <label className="flex items-center gap-2 text-sm sm:text-base">
            <input type="checkbox" name="published" /> <span>Publié</span>
          </label>
        </div>

        <input name="cover_object_name" placeholder="object_name cover (optionnel)" className="h-11 w-full rounded-xl bg-white/5 px-3 text-sm sm:text-base" />

        {err && <div className="text-red-400 text-sm">{err}</div>}
        <button className="btn-cta-lg w-full sm:w-auto text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3" disabled={loading}>{loading ? 'Création…' : 'Créer la formation'}</button>
      </form>
    </div>
  );
}