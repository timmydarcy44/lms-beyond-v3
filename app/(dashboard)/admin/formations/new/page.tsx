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
    <form onSubmit={onSubmit} className="glass p-6 rounded-2xl max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold text-iris-grad">Nouvelle formation</h1>

      <input name="title" placeholder="Titre" required className="h-11 w-full rounded-xl bg-white/5 px-3" />
      <textarea name="description" rows={4} placeholder="Description" className="w-full rounded-xl bg-white/5 px-3 py-2" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select name="visibility_mode" className="h-11 rounded-xl bg-white/5 px-3">
          <option value="private">Privée</option>
          <option value="catalog_only">Catalogue</option>
          <option value="public">Publique</option>
        </select>
        <select name="reading_mode" className="h-11 rounded-xl bg-white/5 px-3">
          <option value="free">Libre</option>
          <option value="linear">Linéaire</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input 
          name="theme" 
          placeholder="Thème (ex: business, management, iris, blush...)" 
          maxLength={64}
          className="h-11 rounded-xl bg-white/5 px-3" 
        />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" /> <span>Publié</span>
        </label>
      </div>

      <input name="cover_object_name" placeholder="object_name cover (optionnel)" className="h-11 w-full rounded-xl bg-white/5 px-3" />

      {err && <div className="text-red-400 text-sm">{err}</div>}
      <button className="btn-cta-lg" disabled={loading}>{loading ? 'Création…' : 'Créer la formation'}</button>
    </form>
  );
}