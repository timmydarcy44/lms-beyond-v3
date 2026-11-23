# Appliquer analyse du besoin Qualiopi v2

Fichier : `supabase/migrations/20261123190000_need_analyses_qualiopi_v2.sql`

À exécuter dans le **SQL Editor Supabase** du projet prod.

Effets :
1. Colonnes v2 sur `organization_need_analyses` (type, échange, validation, PDF…)
2. `profiles.is_pedagogical_manager` (cocher les Responsables pédagogiques)
3. `training_courses.catalog_surfaces` + retrait de *Les fondamentaux de la neuroéducation* du catalogue entreprise

Sans cette migration : les nouveaux champs ne se sauvent pas, l’envoi client échoue, la formation reste visible côté entreprise.
