# Appliquer traçabilité validation client + RP

Fichier : `supabase/migrations/20261123200000_need_analyses_client_validation_trace.sql`

Effets :
1. Colonnes `client_validation_source|proof|email|ip|at_ts` sur `organization_need_analyses`
2. Reset des `client_validated_at` non tracés (aucune en prod au 2026-11-23)
3. Jessica Contentin (`contentin.cabinet@gmail.com`) → `is_pedagogical_manager = true`
