# Appliquer fiches formation Qualiopi ind.1 (publique)

Fichier : `supabase/migrations/20261123210000_training_fiche_qualiopi_public_fix.sql`

**Déjà appliqué via API service role (prod)** :
- Dépublier `accompagnement-individuel-cible` (`is_active=false`)
- Contact référent Jessica sur fiches catalogue
- Alignement modalités header ↔ détail
- `updated_at` = 23 nov. 2026
- Template SEO DB `training` → Byound Business

**Reste SQL Editor** (colonne `handicap_referent` si absente) : exécuter le migration file, ou au minimum :

```sql
alter table public.training_courses
  add column if not exists handicap_referent text;
```

Sans cette colonne : la constante site est utilisée (comportement attendu).
