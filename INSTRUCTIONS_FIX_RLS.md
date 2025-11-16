# 🔧 Instructions pour Corriger l'Erreur RLS sur sections

## 🎯 Problème

L'erreur `new row violates row-level security policy for table "sections"` indique que :
1. Il existe une table `sections` dans votre base de données
2. Cette table a RLS (Row Level Security) activé
3. Il n'y a pas de policy RLS qui permet aux instructors de créer des sections

## ✅ Solution

### Option 1 : Exécuter le Script SQL (RECOMMANDÉ)

1. **Allez sur Supabase Studio** : https://app.supabase.com
2. **Sélectionnez votre projet**
3. **Allez dans SQL Editor**
4. **Ouvrez le fichier** `supabase/FIX_RLS_COURSES_AND_SECTIONS.sql`
5. **Copiez tout le contenu** et collez-le dans l'éditeur SQL
6. **Exécutez** le script (Run ou Ctrl+Enter)

Ce script va :
- ✅ Créer des RLS policies pour `courses` permettant aux instructors de créer/modifier
- ✅ Créer des RLS policies pour `sections` permettant aux instructors de créer/modifier
- ✅ Permettre la lecture publique des formations et sections publiées

### Option 2 : Créer Manuellement la Policy (Alternative)

Si vous préférez créer la policy manuellement dans Supabase Studio :

```sql
-- 1. Vérifier que la table sections existe
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'sections';

-- 2. Si elle existe, créer la policy
CREATE POLICY sections_instructor_all ON public.sections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = sections.course_id
        AND (
          c.creator_id = auth.uid()
          OR c.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('admin', 'instructor')
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = sections.course_id
        AND (
          c.creator_id = auth.uid()
          OR c.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND p.role IN ('admin', 'instructor')
          )
        )
    )
  );
```

### Option 3 : Désactiver Temporairement RLS (NON RECOMMANDÉ)

⚠️ **Attention** : Cette solution désactive la sécurité. Utilisez-la uniquement pour tester.

```sql
ALTER TABLE public.sections DISABLE ROW LEVEL SECURITY;
```

**Pensez à réactiver RLS après** :
```sql
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
```

## 🔍 Vérification

Après avoir exécuté le script, vérifiez que :

1. **Les policies existent** :
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('courses', 'sections');
```

2. **Essayez de créer une formation** depuis l'interface formateur
3. **L'erreur devrait avoir disparu**

## 📝 Note

Si la table `sections` n'existe pas dans votre base de données, le problème peut venir d'un trigger ou d'une autre table. Dans ce cas :
1. Vérifiez les triggers sur la table `courses`
2. Vérifiez les logs serveur pour plus de détails
3. Contactez-moi avec les détails de l'erreur complète



