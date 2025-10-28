# LMS

LMS minimal et extensible — Learning Management System

## 🚀 Démarrage rapide

```bash
npm install
npm run dev
```

L'application sera disponible sur http://localhost:3000

## 📁 Structure

```
app/
  ├── page.tsx              # Dashboard principal
  ├── courses/page.tsx       # Catalogue des cours
  ├── __env/page.tsx         # Vérification variables d'environnement
  ├── __sb/page.tsx          # Test Supabase
  ├── api/
  │   └── ping/route.ts      # Health check API
  └── _ping/page.tsx         # Health check statique

lib/
  └── supabase/
      └── browser.ts         # Client Supabase côté client

legacy/                       # Ancien code archivé
```

## 🔧 Technologies

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Supabase** (intégration préparée)
- **Zod** (validation)

## 📝 Pages de diagnostic

- `/_ping` - Health check statique
- `/__env` - Variables d'environnement
- `/__sb` - Test Supabase (nécessite env variables)

## 🗄️ Supabase

Le projet est configuré pour Supabase. Configurez vos variables d'environnement :

```env
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🧩 Extensibilité

Ce LMS est un squelette minimal prêt à être étendu :
- Authentification (Supabase Auth)
- Base de données (Supabase Postgres)
- Gestion des cours
- Inscriptions étudiants
- Interface formateur

